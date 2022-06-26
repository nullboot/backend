import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '../config/config.module';
import { UserEntity } from './user.entity';
import { DatabaseModule } from '../database/database.module';
import { Connection, QueryFailedError, Repository } from 'typeorm';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { UpdateUserProfileError, UserProfileDto } from './dto';
import { Role } from '../common/role';
import { NewbieModule } from '../newbie/newbie.module';
import { TutorModule } from '../tutor/tutor.module';
import { TagModule } from '../tag/tag.module';
import { NewbieEntity } from '../newbie/newbie.entity';
import { TutorEntity } from '../tutor/tutor.entity';
import { CityEntity } from '../tag/tag-city.entity';
import { DivisionEntity } from '../tag/tag-division.entity';
import { DivisionService } from '../tag/tag-division.service';
import { WildcardType } from '../common/dto';

describe('UserService', () => {
  let service: UserService;
  let userRepo: Repository<UserEntity>;
  let newbieRepo: Repository<NewbieEntity>;
  let tutorRepo: Repository<TutorEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let connection: Connection;
  let Alice: UserEntity;
  let Bob: UserEntity;
  let Carol: UserEntity;
  let Dave: UserEntity;
  let AliceAuth: UserAuthEntity;
  let cityRepo: Repository<CityEntity>;
  let divisionRepo: Repository<DivisionEntity>;
  let divisionService: DivisionService;

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
      ],
      providers: [UserService],
    }).compile();

    divisionService = module.get<DivisionService>(DivisionService);
    service = module.get<UserService>(UserService);
    connection = module.get<Connection>(Connection);
    cityRepo = module.get<Repository<CityEntity>>(
      getRepositoryToken(CityEntity),
    );
    divisionRepo = module.get<Repository<DivisionEntity>>(
      getRepositoryToken(DivisionEntity),
    );
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    userAuthRepo = module.get<Repository<UserAuthEntity>>(
      getRepositoryToken(UserAuthEntity),
    );
    newbieRepo = module.get<Repository<NewbieEntity>>(
      getRepositoryToken(NewbieEntity),
    );
    tutorRepo = module.get<Repository<TutorEntity>>(
      getRepositoryToken(TutorEntity),
    );
    await userRepo.delete({});
    await newbieRepo.delete({});
    await tutorRepo.delete({});
  });

  beforeEach(async () => {
    Alice = userRepo.create({
      id: 1,
      username: 'Alice',
      realname: 'alice',
      email: 'alice@null',
      roles: [],
    });
    AliceAuth = userAuthRepo.create({
      userId: Alice.id,
      password: 'unknown',
    });
    await userRepo.save(Alice);
    await userAuthRepo.save(AliceAuth);
  });

  afterEach(async () => {
    await userRepo.delete({});
    await newbieRepo.delete({});
    await tutorRepo.delete({});
    await cityRepo.delete({});
    await divisionRepo.delete({});
  });
  afterAll(async () => await connection.close());

  /**
   * 用于测试时创建一个新用户
   */
  async function createUser(
    Id: number,
    userName: string,
    realName: string,
    Email: string,
    Roles: Role[],
    Password: string,
  ): Promise<UserEntity> {
    const Bob = userRepo.create({
      id: Id,
      username: userName,
      realname: realName,
      email: Email,
      roles: Roles,
    });
    const BobAuth = userAuthRepo.create({
      userId: Bob.id,
      password: Password,
    });
    await userRepo.save(Bob);
    await userAuthRepo.save(BobAuth);
    return Bob;
  }

  function removeDate(user: UserEntity): UserEntity {
    user.registerTime = null;
    return user;
  }

  function removeDates(users: UserEntity[]): UserEntity[] {
    return users.map(removeDate);
  }

  //测试创建用户，注意里面已经有了一个alice
  it('create user', async () => {
    Bob = await service.create({
      username: 'Bob',
      realname: 'bob',
      email: 'bob@null.com',
      publicEmail: false,
      roles: [Role.TUTOR, Role.NEWBIE],
      divisionId: null,
      password: undefined,
    });
    expect(removeDate(await service.findByUsername('Bob'))).toEqual(
      removeDate(Bob),
    );
  });

  //检查列表
  async function chkList(
    skip: number,
    take: number,
    role: Role,
    withoutRole: boolean,
    ans: UserEntity[],
    cnt: number,
  ): Promise<void> {
    const [list, count] = await service.getList(
      skip,
      take,
      role == null
        ? {}
        : { filterByRole: { role: role, without: withoutRole } },
    );
    expect(removeDates(list.sort())).toEqual(removeDates(ans.sort()));
    expect(count).toEqual(cnt);
  }

  //测试查找用户列表
  it('get list', async () => {
    Bob = await service.create({
      username: 'Bob',
      realname: 'bob',
      email: 'bob@a.com',
      publicEmail: false,
      roles: [],
      divisionId: null,
      password: undefined,
    });
    Carol = await service.create({
      username: 'Carol',
      realname: 'carol',
      email: 'carol@a.com',
      publicEmail: false,
      roles: [Role.TUTOR],
      divisionId: null,
      password: undefined,
    });
    await chkList(0, 10, null, false, [Alice, Bob, Carol], 3);
    Dave = await service.create({
      username: 'Dave',
      realname: 'dave',
      email: 'dave@a.com',
      publicEmail: false,
      roles: [Role.NEWBIE],
      divisionId: null,
      password: undefined,
    });
    await chkList(0, 10, null, false, [Alice, Bob, Carol, Dave], 4);
    await chkList(1, 2, null, false, [Bob, Carol], 4);
  });

  //测试查找(不)包含某类身份的用户列表
  it('get list with(out) role', async () => {
    await service.updateRoles(Alice, []);
    Bob = await service.create({
      username: 'Bob',
      realname: 'bob',
      email: 'bob@a.com',
      publicEmail: false,
      roles: [Role.NEWBIE],
      divisionId: null,
      password: undefined,
    });
    Carol = await service.create({
      username: 'Carol',
      realname: 'carol',
      email: 'carol@a.com',
      publicEmail: false,
      roles: [Role.TUTOR],
      divisionId: null,
      password: undefined,
    });
    await chkList(0, 10, Role.NEWBIE, true, [Alice, Carol], 2);
    await chkList(0, 10, Role.TUTOR, true, [Alice, Bob], 2);
    Dave = await service.create({
      username: 'Dave',
      realname: 'dave',
      email: 'dave@a.com',
      publicEmail: false,
      roles: [Role.NEWBIE, Role.TUTOR, Role.ADMIN],
      divisionId: null,
      password: undefined,
    });
    await chkList(0, 10, Role.NEWBIE, true, [Alice, Carol], 2);
    await chkList(0, 10, Role.HRBP, true, [Alice, Bob, Carol, Dave], 4);
    await chkList(0, 10, Role.ADMIN, true, [Alice, Bob, Carol], 3);
    await chkList(0, 10, Role.NEWBIE, false, [Bob, Dave], 2);
    await chkList(0, 10, Role.ADMIN, false, [Dave], 1);

    await service.updateRoles(Bob, [Role.ADMIN]);
    await chkList(0, 10, Role.NEWBIE, true, [Alice, Bob, Carol], 3);
    await chkList(0, 10, Role.ADMIN, true, [Alice, Carol], 2);
    await chkList(0, 10, Role.NEWBIE, false, [Dave], 1);
    await chkList(0, 10, Role.ADMIN, false, [Bob, Dave], 2);

    await service.updateRoles(Bob, [Role.NEWBIE]);
    await chkList(0, 10, Role.NEWBIE, false, [Bob, Dave], 2);
    await chkList(0, 10, Role.ADMIN, false, [Dave], 1);
    await chkList(0, 10, Role.NEWBIE, true, [Alice, Carol], 2);
    await chkList(0, 10, Role.ADMIN, true, [Alice, Bob, Carol], 3);

    await service.updateRoles(Carol, [Role.NEWBIE]);
    await chkList(1, 1, Role.ADMIN, true, [Bob], 3);
    await chkList(1, 1, Role.NEWBIE, false, [Carol], 3);
  });

  /**
   * 测试查找用户
   */
  it('find', async () => {
    // 根据id查找
    expect(await service.findById(Alice.id)).toEqual(Alice);

    // 根据用户名查找
    expect(await service.findByUsername(Alice.username)).toEqual(Alice);

    // 根据邮箱查找
    expect(await service.findByEmail(Alice.email)).toEqual(Alice);
  });

  /**
   * 测试查找一个不存在的用户
   */
  it('find (fail)', async () => {
    // 根据id查找
    expect(await service.findById(0)).not.toBeDefined();
    expect(await service.findById(0.7)).not.toBeDefined();
    expect(await service.findById(1.1)).not.toBeDefined();
    expect(await service.findById(-1)).not.toBeDefined();
    expect(await service.findById(4294967297)).not.toBeDefined();
    expect(await service.findById(1e100)).not.toBeDefined();
    // 数据库接收一个NaN时会炸掉
    await expect(service.findById(NaN)).rejects.toThrow(QueryFailedError);

    //根据用户名查找
    expect(await service.findByUsername('Bob')).not.toBeDefined();
    expect(await service.findByUsername('')).not.toBeDefined();
    expect(
      await service.findByUsername('"; DROP DATABASE test; --'),
    ).not.toBeDefined();

    //根据邮箱查找
    expect(await service.findByUsername('Bob@null')).not.toBeDefined();
    expect(await service.findByUsername('')).not.toBeDefined();
  });

  //测试更新邮箱（成功更新）
  it('update email', async () => {
    await service.updateProfile(Alice, {
      username: Alice.username,
      realname: Alice.realname,
      email: 'bob@null',
      publicEmail: Alice.publicEmail,
    });
    expect((await service.findById(Alice.id)).email).toEqual('bob@null');

    //修改时保持不变
    await service.updateProfile(Alice, {
      username: Alice.username,
      realname: Alice.realname,
      email: 'bob@null',
      publicEmail: Alice.publicEmail,
    });
    expect((await service.findById(Alice.id)).email).toEqual('bob@null');
  });

  //测试更新邮箱（失败，因为邮箱重复）
  it('update email (fail)', async () => {
    await createUser(2, 'Bob', 'bob', 'bob@null', [], 'unknown');
    expect(
      await service.updateProfile(Alice, {
        username: Alice.username,
        realname: Alice.realname,
        email: 'bob@null',
        publicEmail: Alice.publicEmail,
      }),
    ).toEqual([UpdateUserProfileError.DUPLICATE_EMAIL, null]);
    // expect(
    //   await service.updateProfile(
    //     Alice,
    //     Alice.username,
    //     Alice.realname,
    //     '',
    //     Alice.publicEmail,
    //   ),
    // ).toEqual(PostProfileError.DUPLICATE_EMAIL);
  });

  //用于方便修改用户名
  async function changeUsername(
    newUsername: string,
    Error: UpdateUserProfileError,
  ): Promise<string> {
    const [err, user] = await service.updateProfile(Alice, {
      username: newUsername,
      realname: Alice.realname,
      email: Alice.email,
      publicEmail: Alice.publicEmail,
    });
    expect(err).toEqual(Error);
    return user?.username;
  }

  async function sucChangeUsername(newUsername: string): Promise<void> {
    expect(await changeUsername(newUsername, null)).toEqual(newUsername);
  }

  //测试更新用户名（成功更新）
  it('update username', async () => {
    await sucChangeUsername('Bob'); //普通更新
    await sucChangeUsername('张三'); //把用户名改成中文字符
    await sucChangeUsername(' %&\n\\  %u6D4B%u8BD5'); //把用户名改成特殊字符
    await sucChangeUsername(' %&\n\\  %u6D4B%u8BD5'); //保持用户名不变
    await sucChangeUsername(''); //把用户名改成空串
  });

  //测试更新用户名（失败更新）
  it('update username (fail)', async () => {
    //把用户名改成已有的
    await createUser(2, 'Bob', 'bob', 'Bob@null', [], 'unknown');
    await changeUsername('Bob', UpdateUserProfileError.DUPLICATE_USERNAME);
    expect((await service.findById(Alice.id)).username).toEqual('Alice');

    //把用户名改成超长字符串
    //串长25，超过了数据库设置的最大允许长度（24），炸掉了
    await expect(
      changeUsername('"; DROP DATABASE test; --', null),
    ).rejects.toThrow(QueryFailedError);
  });

  //用于方便修改真实姓名
  async function changeRealname(
    newRealname: string,
    Error: UpdateUserProfileError,
  ): Promise<string> {
    const [err, user] = await service.updateProfile(Alice, {
      username: Alice.username,
      realname: newRealname,
      email: Alice.email,
      publicEmail: Alice.publicEmail,
    });
    expect(err).toEqual(Error);
    return user?.realname;
  }

  async function sucChangeRealname(newRealname: string): Promise<void> {
    expect(await changeRealname(newRealname, null)).toEqual(newRealname);
  }

  //用于方便修改身份
  async function sucChangeRoles(newRoles: Role[]): Promise<void> {
    await service.updateRoles(Alice, newRoles);
    expect((await service.findById(Alice.id)).roles).toEqual(newRoles);
  }

  //修改真实姓名和身份
  it('update realname and role', async () => {
    await createUser(
      2,
      'Bob',
      'bob',
      'Bob@null',
      [Role.ADMIN, Role.HRBP],
      'unknown',
    );
    await sucChangeRealname('Alice'); //不变
    await sucChangeRealname('Carol'); //正常修改
    await sucChangeRealname('bob'); //与其他人相同
    //现在realname为空是可以的
    await sucChangeRealname(''); //空
    //await sucChangeRealname('"; DROP DATABASE test; --'); //超长

    await sucChangeRoles([]); //不变
    await sucChangeRoles([Role.HRBP, Role.NEWBIE]); //添加
    await sucChangeRoles([Role.HRBP, Role.TUTOR]); //添加+删除
    await sucChangeRoles([Role.TUTOR]); //删除
    await sucChangeRoles([]); //清空
    await sucChangeRoles([Role.ADMIN, Role.HRBP]); //与他人相同
    await sucChangeRoles([Role.HRBP, Role.ADMIN]); //换序

    //await service.updateRoles(Alice, [Role.HRBP, Role.HRBP]);
    //expect((await service.findUserById(Alice.id)).roles).toEqual([Role.HRBP]); //重复
    //注: service层不进行去重，应在controller层就已经去好重了
  });

  //测试profile
  async function profileEqual(
    user: UserEntity,
    profile: UserProfileDto,
    emailAvailable: boolean,
  ): Promise<void> {
    expect(user.id).toEqual(profile.id);
    expect(user.username).toEqual(profile.username);
    expect(user.realname).toEqual(profile.realname);
    expect(user.publicEmail).toEqual(profile.publicEmail);
    expect(user.isRoot).toEqual(profile.isRoot);
    expect(user.registerTime).toEqual(profile.registerTime);
    if (emailAvailable) {
      expect(user.email).toEqual(profile.email);
    } else {
      expect(profile.email).toEqual(null);
    }
  }

  async function chkProfileById(
    user1: number,
    user2: UserEntity,
    emailAvailable: boolean,
  ): Promise<void> {
    const profile = await service.getProfileById(user1, user2);
    const chkUser = await service.findById(user1);
    await profileEqual(chkUser, profile, emailAvailable);
  }

  async function chkProfile(
    user1: UserEntity,
    user2: UserEntity,
    emailAvailable: boolean,
  ): Promise<void> {
    const profile = await service.filterProfile(user1, user2);
    const chkUser = await service.findById(user1.id);
    await profileEqual(chkUser, profile, emailAvailable);
    await chkProfileById(user1.id, user2, emailAvailable);
  }

  it('chk profile by id', async () => {
    expect(await service.getProfileById(null, Alice)).toBeNull();
    expect(await service.getProfileById(2, Alice)).toBeNull();
    await chkProfileById(1, Alice, true);
  });

  async function changePublicEmail(
    user: UserEntity,
    newPublicEmail: boolean,
  ): Promise<void> {
    const [err, newUser] = await service.updateProfile(user, {
      username: user.username,
      realname: user.realname,
      email: user.email,
      publicEmail: newPublicEmail,
    });
    expect(err).toBeNull();
    expect(newUser.publicEmail).toEqual(newPublicEmail);
  }

  it('user profile', async () => {
    const Bob = await createUser(
      2,
      'Bob',
      'bob',
      'Bob@null',
      [Role.ADMIN, Role.HRBP],
      'known',
    );
    //最开始publicEmail为false
    await chkProfile(Bob, Alice, false);
    await chkProfile(Alice, Bob, true);
    await chkProfile(Alice, Alice, true);
    await chkProfile(Bob, Bob, true);

    await service.updateRoles(Alice, [Role.ADMIN]);
    await chkProfile(Bob, Alice, true);
    await service.updateRoles(Alice, []);
    await chkProfile(Bob, Alice, false);

    await changePublicEmail(Bob, true);
    await chkProfile(Bob, Alice, true);
    await chkProfile(Bob, Bob, true);

    await changePublicEmail(Bob, false);
    await chkProfile(Bob, Alice, false);

    //把Alice设置成root，应该能查到Bob的邮箱
    Alice.isRoot = true;
    await userRepo.save(Alice);
    await chkProfile(Bob, Alice, true);
  });

  it('search username', async () => {
    expect(
      (
        await service.getList(0, 10, { searchRealname: { keyword: 'alice' } })
      )[1],
    ).toEqual(1);
    expect(
      (await service.getList(0, 10, { searchRealname: { keyword: 'bob' } }))[1],
    ).toEqual(0);
    expect(
      (
        await service.getList(0, 10, {
          searchRealname: { keyword: 'ice', wildcard: WildcardType.BEGIN },
        })
      )[1],
    ).toEqual(1);
  });

  it('get count by division tag id', async () => {
    expect(await service.getCountByDivisionId(-1)).toEqual(0);
    const div = (await divisionService.create('div'))[1];
    const div2 = (await divisionService.create('div2'))[1];
    expect(await service.getCountByDivisionId(div.id)).toEqual(0);
    await service.updateProfile(Alice, { divisionId: div.id });
    expect(await service.getCountByDivisionId(div.id)).toEqual(1);
    await service.updateProfile(Alice, { divisionId: div2.id });
    expect(await service.getCountByDivisionId(div.id)).toEqual(0);
  });
});
