import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Connection, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { UserAuthEntity } from './user-auth.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { AuthStrategy } from './auth.strategy';
import { Role } from '../common/role';
import * as bcrypt from 'bcrypt';
import { PostError, LoginError, LogoutError, PostResponseDto } from './dto';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let connection: Connection;
  let Alice: UserEntity;
  let Bob: UserEntity;
  let controller: AuthController;
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([UserAuthEntity]),
        ConfigModule,
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.config.security.jwtSecret,
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [AuthService, AuthStrategy],
      controllers: [AuthController],
    }).compile();

    connection = module.get<Connection>(Connection);
    controller = module.get<AuthController>(AuthController);
    userService = module.get<UserService>(UserService);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    userAuthRepo = module.get<Repository<UserAuthEntity>>(
      getRepositoryToken(UserAuthEntity),
    );
    await userRepo.delete({});
  });

  class userAndAuth {
    public user: UserEntity;
    public auth: UserAuthEntity;
  }

  // 用于测试时创建一个新用户
  async function createUser(
    Id: number,
    userName: string,
    realName: string,
    Email: string,
    Roles: Role[],
    Password: string,
  ): Promise<userAndAuth> {
    const Alice = userRepo.create({
      id: Id,
      username: userName,
      realname: realName,
      email: Email,
      roles: Roles,
    });
    const AliceAuth = userAuthRepo.create({
      userId: Alice.id,
      password: await bcrypt.hash(Password, 10),
    });
    await userRepo.save(Alice);
    await userAuthRepo.save(AliceAuth);
    return { user: Alice, auth: AliceAuth };
  }

  beforeEach(async () => {
    let newUser = await createUser(
      1,
      'Alice',
      'alice',
      'alice@null',
      [],
      'unknown',
    );
    Alice = newUser.user;
    newUser = await createUser(
      2,
      'Bob',
      'bob',
      'Bob@null',
      [Role.ADMIN],
      'password',
    );
    Bob = newUser.user;
  });

  afterEach(async () => await userRepo.delete({}));
  afterAll(async () => await connection.close());

  // 登录
  it('POST login', async () => {
    const expectRes = await userService.filterProfile(Alice, Alice);
    //以用户名正常登入
    let res = await controller.login({
      username: Alice.username,
      password: 'unknown',
    });
    expect(res.profile).toEqual(expectRes);

    //以邮箱正常登入
    res = await controller.login({
      email: Alice.email,
      password: 'unknown',
    });
    expect(res.profile).toEqual(expectRes);

    //用户名和邮箱同时存在
    res = await controller.login({
      username: Alice.username,
      email: Alice.email,
      password: 'unknown',
    });
    expect(res.profile).toEqual(expectRes);

    //用户名和邮箱不是来自同一个人
    //要求：这里在两个字段都存在时，自动选择username进行匹配而忽略email
    res = await controller.login({
      username: Alice.username,
      email: Bob.email,
      password: 'unknown',
    });
    expect(res.profile).toEqual(expectRes);

    //查无此人
    //仍然存在不区分大小写的问题
    expect(
      await controller.login({ email: 'lice@null', password: 'unknown' }),
    ).toEqual({ error: LoginError.NO_SUCH_USER });
    expect(
      await controller.login({ username: 'lice', password: 'unknown' }),
    ).toEqual({ error: LoginError.NO_SUCH_USER });
    expect(
      await controller.login({
        username: 'lice',
        email: 'lice@null',
        password: 'unknown',
      }),
    ).toEqual({ error: LoginError.NO_SUCH_USER });

    //密码错误
    //注：密码可以正常区分大小写
    expect(
      await controller.login({ email: 'alice@null', password: 'Unknown' }),
    ).toEqual({ error: LoginError.WRONG_PASSWORD });
    expect(
      await controller.login({ username: 'Alice', password: 'Unknown' }),
    ).toEqual({ error: LoginError.WRONG_PASSWORD });
    expect(await controller.login({ username: 'Alice', password: '' })).toEqual(
      { error: LoginError.WRONG_PASSWORD },
    );
    expect(
      await controller.login({
        username: 'Alice',
        password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', //length=33
      }),
    ).toEqual({ error: LoginError.WRONG_PASSWORD });

    //虚空登录
    expect(await controller.login({ password: 'unknown' })).toEqual({
      error: LoginError.NO_SUCH_USER,
    });

    //即使email字段能匹配上，如果username字段的匹配挂掉了，仍然算作挂掉
    expect(
      await controller.login({
        username: 'lice',
        email: Alice.email,
        password: 'unknown',
      }),
    ).toEqual({ error: LoginError.NO_SUCH_USER });
    expect(
      await controller.login({
        username: Alice.username,
        email: Bob.email,
        password: 'password',
      }),
    ).toEqual({ error: LoginError.WRONG_PASSWORD });
  });

  // 登出
  it('POST logout', async () => {
    //正常登出
    expect(await controller.postLogout(Bob, { userId: Bob.id })).toEqual({});

    //登出其他人
    expect(await controller.postLogout(Alice, { userId: Bob.id })).toEqual({
      error: LogoutError.PERMISSION_DENIED,
    });

    //登出不存在的人
    expect(await controller.postLogout(Alice, { userId: 4 })).toEqual({
      error: LogoutError.NO_SUCH_USER,
    });

    //在没登入的状态下登出
    expect(await controller.postLogout(null, { userId: Bob.id })).toEqual({
      error: LogoutError.NOT_LOGIN,
    });
  });

  // 用户认证
  it('POST ', async () => {
    // 未登录
    expect(await controller.post(null)).toEqual<PostResponseDto>({
      error: PostError.NOT_LOGIN,
    });

    // 正常登录
    expect(await controller.post(Alice)).toEqual<PostResponseDto>({
      profile: await userService.filterProfile(Alice, Alice),
    });
  });
});
