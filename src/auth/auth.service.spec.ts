import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Connection, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { UserAuthEntity } from './user-auth.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { Role } from '../common/role';
import { JwtModule } from '@nestjs/jwt';
import { AuthStrategy } from './auth.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '../config/config.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let connection: Connection;
  let Alice: UserEntity;
  let Bob: UserEntity;
  let AliceAuth: UserAuthEntity;

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
    }).compile();

    service = module.get<AuthService>(AuthService);
    connection = module.get<Connection>(Connection);
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

  //用于测试时创建一个新用户
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
      password: Password,
    });
    await userRepo.save(Alice);
    await userAuthRepo.save(AliceAuth);
    return { user: Alice, auth: AliceAuth };
  }

  beforeEach(async () => {
    const newUser = await createUser(
      1,
      'Alice',
      'alice',
      'alice@null',
      [],
      'password', //这里以明文形式存入password，但数据库正常运行时应该存入的是密文
    );
    Alice = newUser.user;
    AliceAuth = newUser.auth;
    Bob = (await createUser(2, 'Bob', 'bob', 'bob@null', [], 'unknown')).user;
  });

  afterEach(async () => await userRepo.delete({}));
  afterAll(async () => await connection.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //查询auth
  it('find auth', async () => {
    expect(await service.findByUserId(Alice.id)).toEqual(AliceAuth);
  });

  //加密
  function chkString(str1: string, str2: string): boolean {
    return str1 == str2;
  }

  it('hash password', async () => {
    const hashedPassword = bcrypt.hash('password', 10);
    expect(chkString('password', 'password')).toEqual(true);
    expect(chkString(await hashedPassword, 'password')).toEqual(false);
  });

  //查询密码
  it('check password', async () => {
    //由于create user时往里存的password是明文，这里应该会返回false
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'password',
      ),
    ).toEqual(false);

    await service.changePassword(
      await service.findByUserId(Alice.id),
      'password',
    );
    await service.changePassword(await service.findByUserId(Bob.id), 'unknown');
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'password',
      ),
    ).toEqual(true);
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'unknown',
      ),
    ).toEqual(false);
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'Password',
      ),
    ).toEqual(false);
    expect(
      await service.checkPassword(await service.findByUserId(Alice.id), ''),
    ).toEqual(false);
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        '"; DROP DATABASE test; --',
      ),
    ).toEqual(false);
  });

  //修改密码
  it('change password', async () => {
    //正常修改
    await service.changePassword(
      await service.findByUserId(Alice.id),
      'unknown',
    );
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'password',
      ),
    ).toEqual(false);
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'unknown',
      ),
    ).toEqual(true);

    //空串
    await service.changePassword(await service.findByUserId(Alice.id), '');
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        'unknown',
      ),
    ).toEqual(false);
    expect(
      await service.checkPassword(await service.findByUserId(Alice.id), ''),
    ).toEqual(true);

    //超长
    await service.changePassword(
      await service.findByUserId(Alice.id),
      '"; DROP DATABASE test; --',
    );
    expect(
      await service.checkPassword(await service.findByUserId(Alice.id), ''),
    ).toEqual(false);
    expect(
      await service.checkPassword(
        await service.findByUserId(Alice.id),
        '"; DROP DATABASE test; --',
      ),
    ).toEqual(true);
  });
});
