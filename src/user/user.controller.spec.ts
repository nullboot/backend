import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Connection, QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import {
  CreateUserError,
  GetUserProfileError,
  GetUserProfileResponseDto,
  GetUsersError,
  UpdatePasswordError,
  UpdatePasswordResponseDto,
  UpdateUserProfileError,
  UpdateUserProfileRequestDto,
  UpdateUserProfileResponseDto,
  UpdateUserRolesError,
} from './dto';
import { Role } from '../common/role';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { NewbieModule } from '../newbie/newbie.module';
import { TutorModule } from '../tutor/tutor.module';
import { TagModule } from '../tag/tag.module';
import { PermissionModule } from '../permission/permission.module';
import { TemplateModule } from '../template/template.module';
import { DivisionEntity } from '../tag/tag-division.entity';
import { CityEntity } from '../tag/tag-city.entity';
import { CityService } from '../tag/tag-city.service';
import { DivisionService } from '../tag/tag-division.service';
import { PermissionEntity } from '../permission/permission.entity';

describe('UserController', () => {
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let connection: Connection;
  let Alice: UserEntity;
  let Bob: UserEntity;
  let Root: UserEntity;
  let Admin: UserEntity;
  let controller: UserController;
  let authService: AuthService;
  let cityService: CityService;
  let divisionService: DivisionService;
  let cityRepo: Repository<CityEntity>;
  let divisionRepo: Repository<DivisionEntity>;

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
    isRoot: boolean,
  ): Promise<userAndAuth> {
    const Alice = userRepo.create({
      id: Id,
      username: userName,
      realname: realName,
      email: Email,
      roles: Roles,
      isRoot: isRoot,
    });
    const AliceAuth = userAuthRepo.create({
      userId: Alice.id,
      password: await bcrypt.hash(Password, 10),
    });
    await userRepo.save(Alice);
    await userAuthRepo.save(AliceAuth);
    return { user: Alice, auth: AliceAuth };
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([UserEntity]),
        ConfigModule,
        forwardRef(() => DatabaseModule),
        forwardRef(() => AuthModule),
        forwardRef(() => NewbieModule),
        forwardRef(() => TutorModule),
        forwardRef(() => TagModule),
        forwardRef(() => PermissionModule),
        forwardRef(() => TagModule),
        forwardRef(() => TemplateModule),
      ],
      providers: [UserService],
      controllers: [UserController],
    }).compile();
    cityService = module.get<CityService>(CityService);
    divisionService = module.get<DivisionService>(DivisionService);
    authService = module.get<AuthService>(AuthService);
    connection = module.get<Connection>(Connection);
    controller = module.get<UserController>(UserController);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    userAuthRepo = module.get<Repository<UserAuthEntity>>(
      getRepositoryToken(UserAuthEntity),
    );
    cityRepo = module.get<Repository<CityEntity>>(
      getRepositoryToken(CityEntity),
    );
    divisionRepo = module.get<Repository<DivisionEntity>>(
      getRepositoryToken(DivisionEntity),
    );
    await userRepo.delete({});
  });

  beforeEach(async () => {
    let newUser = await createUser(
      1,
      'Alice',
      'alice',
      'alice@null',
      [],
      'unknown',
      false,
    );
    Alice = newUser.user;
    newUser = await createUser(
      2,
      'Bob',
      'bob',
      'Bob@null',
      [Role.ADMIN],
      'password',
      false,
    );
    Bob = newUser.user;
    newUser = await createUser(
      3,
      'Root',
      'root',
      'Root@null',
      [],
      'password123',
      true,
    );
    Root = newUser.user;
    newUser = await createUser(
      4,
      'Admin',
      'admin',
      'admin@null',
      [Role.ADMIN, Role.NEWBIE, Role.HRBP],
      'password123',
      false,
    );
    Admin = newUser.user;
  });

  afterEach(async () => {
    await userRepo.delete({});
    await cityRepo.delete({});
    await divisionRepo.delete({});
  });
  afterAll(async () => await connection.close());

  function getExpectedRes(
    user: UserEntity,
    publicEmail: boolean,
  ): GetUserProfileResponseDto {
    return {
      profile: {
        id: user.id,
        username: user.username,
        realname: user.realname,
        email: publicEmail ? user.email : null,
        publicEmail: user.publicEmail,
        isRoot: user.isRoot,
        registerTime: user.registerTime,
        roles: user.roles,
        city: null,
        division: null,
      },
    };
  }

  //查询用户信息
  it('GET profile', async () => {
    const expectedAlice = getExpectedRes(Alice, true);
    const expectedBob = getExpectedRes(Bob, false);
    // 未登录
    expect(
      await controller.getUserProfile(null, Alice.id),
    ).toEqual<GetUserProfileResponseDto>({
      error: GetUserProfileError.PERMISSION_DENIED,
    });

    //Alice查询自己
    // 以 id 获取
    expect(await controller.getUserProfile(Alice, Alice.id)).toEqual(
      expectedAlice,
    );

    //Bob查询Alice
    // 以 id 获取
    expect(await controller.getUserProfile(Bob, Alice.id)).toEqual(
      expectedAlice,
    );

    //Root查询Alice
    // 以 id 获取
    expect(await controller.getUserProfile(Root, Alice.id)).toEqual(
      expectedAlice,
    );

    //Alice查询Bob
    // 以 id 获取
    expect(await controller.getUserProfile(Alice, Bob.id)).toEqual(expectedBob);

    // 不存在
    expect(
      await controller.getUserProfile(Alice, 233),
    ).toEqual<GetUserProfileResponseDto>({
      error: GetUserProfileError.NO_SUCH_USER,
    });
    expect(
      await controller.getUserProfile(Alice, undefined),
    ).toEqual<GetUserProfileResponseDto>({
      error: GetUserProfileError.NO_SUCH_USER,
    });
    await expect(controller.getUserProfile(Alice, NaN)).rejects.toThrow(
      QueryFailedError,
    );
    expect(
      await controller.getUserProfile(Alice, null),
    ).toEqual<GetUserProfileResponseDto>({
      error: GetUserProfileError.NO_SUCH_USER,
    });
  });

  function createPostDto(user: UserEntity): UpdateUserProfileRequestDto {
    return {
      username: user.username,
      email: user.email,
      publicEmail: user.publicEmail,
      realname: user.realname,
    };
  }

  //修改用户信息
  it('POST profile', async () => {
    //未登录
    Bob.username = 'Bobo';
    expect(
      await controller.updateUserProfile(null, Bob.id, createPostDto(Bob)),
    ).toEqual<UpdateUserProfileResponseDto>({
      error: UpdateUserProfileError.PERMISSION_DENIED,
    });
    Bob.username = 'Bob';
    expect(await controller.getUserProfile(Bob, Bob.id)).toEqual(
      getExpectedRes(Bob, true),
    );

    //修改不存在的用户
    const testDto = {
      username: Bob.username,
      realname: Bob.realname,
      email: Bob.email,
      publicEmail: Bob.publicEmail,
      cityId: Bob.cityId,
      divisionId: Bob.divisionId,
    };
    expect(
      await controller.updateUserProfile(Bob, 233, testDto),
    ).toEqual<UpdateUserProfileResponseDto>({
      error: UpdateUserProfileError.NO_SUCH_USER,
    });

    //非管理员修改别人
    Bob.username = 'Bobo';
    expect(
      await controller.updateUserProfile(Alice, Bob.id, createPostDto(Bob)),
    ).toEqual<UpdateUserProfileResponseDto>({
      error: UpdateUserProfileError.PERMISSION_DENIED,
    });
    Bob.username = 'Bob';
    expect(await controller.getUserProfile(Bob, Bob.id)).toEqual(
      getExpectedRes(Bob, true),
    );

    //修改自己的真实姓名
    Alice.realname = 'Bob';
    expect(
      await controller.updateUserProfile(Alice, Alice.id, createPostDto(Alice)),
    ).toEqual<UpdateUserProfileResponseDto>({
      error: UpdateUserProfileError.PERMISSION_DENIED,
    });
    Alice.realname = 'alice';
    expect(await controller.getUserProfile(Alice, Alice.id)).toEqual(
      getExpectedRes(Alice, true),
    );

    //保持不变
    expect(
      await controller.updateUserProfile(Alice, Alice.id, createPostDto(Alice)),
    ).toEqual(getExpectedRes(Alice, true));

    //改自己的用户名、邮箱和公开邮箱
    //hint: Alice的原始邮箱是alice@null
    Alice.username = 'alice';
    Alice.email = 'alicE@null';
    Alice.publicEmail = true;
    expect(
      await controller.updateUserProfile(Alice, Alice.id, createPostDto(Alice)),
    ).toEqual(getExpectedRes(Alice, true));

    //Root改其他人的信息
    Alice.username = 'Clice';
    Alice.realname = 'clice';
    Alice.email = 'Clice@null';
    Alice.publicEmail = true;
    expect(
      await controller.updateUserProfile(Root, Alice.id, createPostDto(Alice)),
    ).toEqual(getExpectedRes(Alice, true));

    async function expectError(error: UpdateUserProfileError) {
      expect(
        await controller.updateUserProfile(
          Alice,
          Alice.id,
          createPostDto(Alice),
        ),
      ).toEqual<UpdateUserProfileResponseDto>({ error });
      Alice.username = 'Clice';
      Alice.email = 'Clice@null';
      expect(await controller.getUserProfile(Alice, Alice.id)).toEqual(
        getExpectedRes(Alice, true),
      );
    }

    //用户名重复
    Alice.username = 'Bob';
    Alice.email = 'Bob@nan';
    await expectError(UpdateUserProfileError.DUPLICATE_USERNAME);

    //邮箱重复
    Alice.username = 'Cob';
    Alice.email = 'Bob@null';
    await expectError(UpdateUserProfileError.DUPLICATE_EMAIL);

    //二者同时重复
    Alice.username = 'Bob';
    Alice.email = 'Bob@null';
    await expectError(UpdateUserProfileError.DUPLICATE_USERNAME);

    //真实姓名允许重复
    Alice.realname = 'bob';
    Alice.publicEmail = false;
    expect(
      await controller.updateUserProfile(Root, Alice.id, createPostDto(Alice)),
    ).toEqual(getExpectedRes(Alice, true));
  });

  async function chkPassword(user: number, password: string): Promise<boolean> {
    return await authService.checkPassword(
      await authService.findByUserId(user),
      password,
    );
  }

  //修改密码
  it('POST password', async () => {
    //未登录
    expect(
      await controller.updateUserPassword(null, Alice.id, {
        oldPassword: 'unknown',
        password: 'password1',
      }),
    ).toEqual<UpdatePasswordResponseDto>({
      error: UpdatePasswordError.PERMISSION_DENIED,
    });
    expect(await chkPassword(Alice.id, 'unknown')).toEqual(true);

    //用户不存在
    expect(
      await controller.updateUserPassword(Alice, 233, {
        oldPassword: 'unknown',
        password: 'password1',
      }),
    ).toEqual<UpdatePasswordResponseDto>({
      error: UpdatePasswordError.NO_SUCH_USER,
    });

    //尝试改别人的密码
    expect(
      await controller.updateUserPassword(Alice, Bob.id, {
        oldPassword: 'password',
        password: 'password1',
      }),
    ).toEqual<UpdatePasswordResponseDto>({
      error: UpdatePasswordError.PERMISSION_DENIED,
    });
    expect(await chkPassword(Bob.id, 'password')).toEqual(true);
    expect(
      await controller.updateUserPassword(Bob, Alice.id, {
        oldPassword: 'unknown',
        password: 'password1',
      }),
    ).toEqual<UpdatePasswordResponseDto>({
      error: UpdatePasswordError.PERMISSION_DENIED,
    });
    expect(await chkPassword(Alice.id, 'unknown')).toEqual(true);

    //改自己的密码
    expect(
      await controller.updateUserPassword(Alice, Alice.id, {
        oldPassword: 'unknown',
        password: 'password1',
      }),
    ).toEqual<UpdatePasswordResponseDto>({});
    expect(await chkPassword(Alice.id, 'password1')).toEqual(true);

    //密码不正确
    expect(
      await controller.updateUserPassword(Alice, Alice.id, {
        oldPassword: 'unknown',
        password: 'password2',
      }),
    ).toEqual<UpdatePasswordResponseDto>({
      error: UpdatePasswordError.WRONG_OLD_PASSWORD,
    });
    expect(await chkPassword(Alice.id, 'password1')).toEqual(true);

    //不传入oldPassword字段
    //修改密码时，对于非root的情况，要先验证传入的参数中oldPassword字段存在
    expect(
      await controller.updateUserPassword(Alice, Alice.id, {
        password: 'password2',
      }),
    ).toEqual<UpdatePasswordResponseDto>({
      error: UpdatePasswordError.PERMISSION_DENIED,
    });
    expect(await chkPassword(Alice.id, 'password1')).toEqual(true);

    //root改他人密码
    expect(
      await controller.updateUserPassword(Root, Alice.id, {
        password: 'password2',
      }),
    ).toEqual<UpdatePasswordResponseDto>({});
    expect(await chkPassword(Alice.id, 'password2')).toEqual(true);
    expect(
      await controller.updateUserPassword(Root, Alice.id, {
        oldPassword: '',
        password: 'password3',
      }),
    ).toEqual<UpdatePasswordResponseDto>({});
    expect(await chkPassword(Alice.id, 'password3')).toEqual(true);

    //密码超短/超长
    //此处不检验密码是否超短/超长，这应当在前端向后端发送请求时被拦截下来
    expect(
      await controller.updateUserPassword(Alice, Alice.id, {
        oldPassword: 'password3',
        password: '',
      }),
    ).toEqual<UpdatePasswordResponseDto>({});
    expect(await chkPassword(Alice.id, '')).toEqual(true);
    expect(
      await controller.updateUserPassword(Alice, Alice.id, {
        oldPassword: '',
        password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', //length=33
      }),
    ).toEqual<UpdatePasswordResponseDto>({});
    expect(
      await chkPassword(Alice.id, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    ).toEqual(true);
  });

  it('update city and division', async () => {
    expect(
      await controller.updateUserProfile(Root, Alice.id, { cityId: 0 }),
    ).toEqual({ error: UpdateUserProfileError.INVALID_CITY });
    expect(
      await controller.updateUserProfile(Root, Alice.id, { divisionId: 0 }),
    ).toEqual({ error: UpdateUserProfileError.INVALID_DIVISION });
    const city = (await cityService.create('city'))[1];
    let profile = (
      await controller.updateUserProfile(Root, Alice.id, { cityId: city.id })
    ).profile;
    expect(profile).toBeDefined();
    expect(profile.city).toEqual(city);
    const division = (await divisionService.create('division'))[1];
    profile = (
      await controller.updateUserProfile(Root, Alice.id, {
        divisionId: division.id,
      })
    ).profile;
    expect(profile).toBeDefined();
    expect(profile.division).toEqual(division);
  });

  it('update user roles', async () => {
    expect(
      await controller.updateUserRoles(Alice, Alice.id, {
        roles: [Role.ADMIN],
      }),
    ).toEqual({ error: UpdateUserRolesError.PERMISSION_DENIED });
    expect(
      await controller.updateUserRoles(Root, 233, {
        roles: [Role.ADMIN],
      }),
    ).toEqual({ error: UpdateUserRolesError.NO_SUCH_USER });
    let profile = (
      await controller.updateUserRoles(Root, Alice.id, {
        roles: [Role.ADMIN, Role.NEWBIE],
      })
    ).profile;
    expect(profile).toBeDefined();
    expect(profile.roles).toEqual([Role.ADMIN, Role.NEWBIE]);
    profile = (
      await controller.updateUserRoles(Root, Alice.id, {
        roles: [Role.ADMIN, Role.TUTOR],
      })
    ).profile;
    expect(profile).toBeDefined();
    expect(profile.roles).toEqual([Role.ADMIN, Role.TUTOR]);
  });
  it('create user', async () => {
    const city = (await cityService.create('city'))[1];
    const division = (await divisionService.create('division'))[1];
    expect(
      await controller.createUser(Alice, {
        username: 'user',
        realname: 'user',
        email: 'user@null.com',
        publicEmail: false,
        roles: [Role.NEWBIE],
        password: 'password',
        cityId: city.id,
        divisionId: division.id,
      }),
    ).toEqual({
      error: CreateUserError.PERMISSION_DENIED,
    });
    expect(
      await controller.createUser(Root, {
        username: 'Alice',
        realname: 'user',
        email: 'user@null.com',
        publicEmail: false,
        roles: [Role.NEWBIE],
        password: 'password',
        cityId: city.id,
        divisionId: division.id,
      }),
    ).toEqual({
      error: CreateUserError.DUPLICATE_USERNAME,
    });
    expect(
      await controller.createUser(Root, {
        username: 'user',
        realname: 'user',
        email: 'alice@null',
        publicEmail: false,
        roles: [Role.NEWBIE],
        password: 'password',
        cityId: city.id,
        divisionId: division.id,
      }),
    ).toEqual({
      error: CreateUserError.DUPLICATE_EMAIL,
    });
    expect(
      await controller.createUser(Root, {
        username: 'user',
        realname: 'user',
        email: 'user@null.com',
        publicEmail: false,
        roles: [Role.NEWBIE],
        password: 'password',
        cityId: -1,
        divisionId: division.id,
      }),
    ).toEqual({
      error: CreateUserError.INVALID_CITY,
    });
    expect(
      await controller.createUser(Root, {
        username: 'user',
        realname: 'user',
        email: 'user@null.com',
        publicEmail: false,
        roles: [Role.NEWBIE],
        password: 'password',
        cityId: city.id,
        divisionId: -1,
      }),
    ).toEqual({
      error: CreateUserError.INVALID_DIVISION,
    });
    const profile = (
      await controller.createUser(Root, {
        username: 'user',
        realname: 'user',
        email: 'user@null.com',
        publicEmail: false,
        roles: [Role.NEWBIE],
        password: 'password',
        cityId: city.id,
        divisionId: division.id,
      })
    ).profile;
    expect(profile).toBeDefined();
    expect(profile.username).toEqual('user');
    expect(profile.city).toEqual({ id: city.id, name: city.name });
    expect(profile.division).toEqual({ id: division.id, name: division.name });
  });

  it('get users', async () => {
    expect(await controller.getUsers(null, { take: 10 })).toEqual({
      error: GetUsersError.PERMISSION_DENIED,
    });
    expect(await controller.getUsers(Admin, { take: 10 })).toEqual({
      error: GetUsersError.PERMISSION_DENIED,
    });
    expect(
      await controller.getUsers(Bob, { take: 10, currentRole: Role.HRBP }),
    ).toEqual({
      error: GetUsersError.PERMISSION_DENIED,
    });
    expect(
      await controller.getUsers(Admin, { take: 10, currentRole: Role.NEWBIE }),
    ).toEqual({
      error: GetUsersError.PERMISSION_DENIED,
    });
    expect(
      await controller.getUsers(Admin, { take: 101, currentRole: Role.ADMIN }),
    ).toEqual({
      error: GetUsersError.TAKE_TOO_MANY,
    });
    expect(
      await controller.getUsers(Admin, { take: 101, currentRole: Role.HRBP }),
    ).toEqual({
      error: GetUsersError.TAKE_TOO_MANY,
    });
    expect(await controller.getUsers(Root, { take: 101 })).toEqual({
      error: GetUsersError.TAKE_TOO_MANY,
    });
    const city = (await cityService.create('city'))[1];
    const division = (await divisionService.create('division'))[1];
    const div2 = (await divisionService.create('div2'))[1];
    expect(await controller.getUsers(Root, { take: 10, cityId: -1 })).toEqual({
      error: GetUsersError.INVALID_CITY,
    });
    expect(
      await controller.getUsers(Root, { take: 10, divisionId: -1 }),
    ).toEqual({
      error: GetUsersError.INVALID_DIVISION,
    });
    expect((await controller.getUsers(Root, { take: 10 })).count).toEqual(4);
    await controller.updateUserProfile(Root, Alice.id, { cityId: city.id });
    await controller.updateUserProfile(Root, Bob.id, { cityId: city.id });
    await controller.updateUserProfile(Root, Admin.id, {
      divisionId: division.id,
    });
    await controller.updateUserProfile(Root, Root.id, {
      divisionId: div2.id,
    });
    expect(
      (await controller.getUsers(Root, { take: 10, cityId: city.id })).count,
    ).toEqual(2);
    expect(
      (
        await controller.getUsers(Root, {
          take: 10,
          divisionId: division.id,
        })
      ).count,
    ).toEqual(1);
    expect(
      await controller.getUsers(Admin, {
        take: 10,
        currentRole: Role.ADMIN,
        divisionId: div2.id,
      }),
    ).toEqual({
      error: GetUsersError.INVALID_DIVISION,
    });
    await connection.getRepository(PermissionEntity).save({
      userId: Admin.id,
      role: Role.ADMIN,
      divisionId: div2.id,
    });
    expect(
      (
        await controller.getUsers(Admin, {
          take: 10,
          divisionId: div2.id,
          currentRole: Role.ADMIN,
        })
      ).count,
    ).toEqual(1);
  });
});
