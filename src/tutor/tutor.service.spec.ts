import { Test, TestingModule } from '@nestjs/testing';
import { TutorService } from './tutor.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TutorEntity } from './tutor.entity';
import { Connection, Repository } from 'typeorm';
import { NewbieModule } from '../newbie/newbie.module';
import { UserModule } from '../user/user.module';
import { TutorController } from './tutor.controller';
import { UserService } from '../user/user.service';
import { NewbieService } from '../newbie/newbie.service';
import { NewbieEntity } from '../newbie/newbie.entity';
import { UserEntity } from '../user/user.entity';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { AuthModule } from '../auth/auth.module';
import { Role } from '../common/role';
import * as bcrypt from 'bcrypt';
import { TutorProfileDto } from './dto';
import { PermissionModule } from '../permission/permission.module';
import { TagModule } from '../tag/tag.module';
import { TemplateModule } from '../template/template.module';
import { CourseModule } from '../course/course.module';
import { TaskModule } from '../task/task.module';
import { ExamModule } from '../exam/exam.module';
import { TutorAwardEntity } from './tutor-award.entity';
import { TutorAwardService } from './tutur-award.service';

describe('TutorService', () => {
  let service: TutorService;
  let connection: Connection;
  let userService: UserService;
  let newbieService: NewbieService;
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let tutorRepo: Repository<TutorEntity>;
  let newbieRepo: Repository<NewbieEntity>;

  let Alice: NewbieEntity;
  let Bob: NewbieEntity;
  let Carol: NewbieEntity;
  let Dave: NewbieEntity;
  let Root: UserEntity;
  let Tutor: TutorEntity;
  let TutorUser: UserEntity;
  let Tutor2: TutorEntity;
  let Tutor3: TutorEntity;
  let Tutor4: TutorEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([TutorEntity, TutorAwardEntity]),
        ConfigModule,
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        forwardRef(() => AuthModule),
        forwardRef(() => ExamModule),
        forwardRef(() => TaskModule),
        forwardRef(() => CourseModule),
        forwardRef(() => NewbieModule),
        forwardRef(() => PermissionModule),
        forwardRef(() => TagModule),
        forwardRef(() => TemplateModule),
      ],
      providers: [TutorService, TutorAwardService],
      controllers: [TutorController],
    }).compile();

    service = module.get<TutorService>(TutorService);
    connection = module.get<Connection>(Connection);
    userService = module.get<UserService>(UserService);
    newbieService = module.get<NewbieService>(NewbieService);

    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    userAuthRepo = module.get<Repository<UserAuthEntity>>(
      getRepositoryToken(UserAuthEntity),
    );
    tutorRepo = module.get<Repository<TutorEntity>>(
      getRepositoryToken(TutorEntity),
    );
    newbieRepo = module.get<Repository<NewbieEntity>>(
      getRepositoryToken(NewbieEntity),
    );
    await userRepo.delete({});
    await newbieRepo.delete({});
    await tutorRepo.delete({});
  });

  async function createUser(
    Id: number,
    userName: string,
    realName: string,
    Email: string,
    Roles: Role[],
    Password: string,
    isRoot: boolean,
  ): Promise<[UserEntity, UserAuthEntity]> {
    const Alice = await userService.create({
      username: userName,
      realname: realName,
      email: Email,
      publicEmail: false,
      roles: Roles,
      divisionId: null,
      password: undefined,
    });
    Alice.isRoot = isRoot;
    await userRepo.save(Alice);

    const AliceAuth = userAuthRepo.create({
      userId: Alice.id,
      password: await bcrypt.hash(Password, 10),
    });
    await userAuthRepo.save(AliceAuth);
    return [Alice, AliceAuth];
  }

  beforeEach(async () => {
    Root = (
      await createUser(
        1,
        'Root',
        'root',
        'root@null',
        [Role.ADMIN],
        'root-pass',
        true,
      )
    )[0];
    Tutor = await service.findByUserId(
      (
        await createUser(
          2,
          'Tutor',
          'tutor',
          'tutor@null',
          [Role.TUTOR],
          'tutor-pass',
          false,
        )
      )[0].id,
    );
    Tutor.isApproved = true;
    Tutor.isGraduate = true;
    Tutor = await tutorRepo.save(Tutor);
    TutorUser = await userService.findById(Tutor.userId);
    Tutor2 = await service.findByUserId(
      (
        await createUser(
          3,
          'Tutor2',
          'tutor2',
          'tutor2@null',
          [Role.TUTOR],
          'tutor2-pass',
          false,
        )
      )[0].id,
    );
    Tutor2 = await tutorRepo.save(Tutor2);

    Alice = await newbieService.findByUserId(
      (
        await createUser(
          4,
          'Alice',
          'alice',
          'alice@null',
          [Role.NEWBIE],
          'alice-pass',
          false,
        )
      )[0].id,
    );
    Alice = await newbieService.assignTutor(Alice, Tutor);

    Bob = await newbieService.findByUserId(
      (
        await createUser(
          5,
          'Bob',
          'bob',
          'bob@null',
          [Role.NEWBIE],
          'bob-pass',
          false,
        )
      )[0].id,
    );
    Bob = await newbieService.assignTutor(Bob, Tutor);

    Carol = await newbieService.findByUserId(
      (
        await createUser(
          6,
          'Carol',
          'carol',
          'carol@null',
          [Role.NEWBIE],
          'carol-pass',
          false,
        )
      )[0].id,
    );
    Carol = await newbieService.assignTutor(Carol, Tutor2);

    Dave = await newbieService.findByUserId(
      (
        await createUser(
          7,
          'Dave',
          'dave',
          'dave@null',
          [Role.NEWBIE],
          'dave-pass',
          false,
        )
      )[0].id,
    );

    Tutor3 = await service.findByUserId(
      (
        await createUser(
          8,
          'Tutor3',
          'tutor3',
          'tutor3@null',
          [Role.TUTOR],
          'tutor3-pass',
          false,
        )
      )[0].id,
    );
    Tutor3.isApproved = true;
    Tutor3.isGraduate = true;
    Tutor3 = await tutorRepo.save(Tutor3);

    Tutor4 = await service.findByUserId(
      (
        await createUser(
          9,
          'Tutor4',
          'tutor4',
          'tutor4@null',
          [Role.TUTOR, Role.NEWBIE],
          'tutor4-pass',
          false,
        )
      )[0].id,
    );
    Tutor4 = await tutorRepo.save(Tutor4);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('find by id and ensure', async () => {
    expect(await service.findByUserId(Tutor.userId)).toEqual(Tutor);
    await service.ensureByUserId(Tutor.userId, false);
    expect(await service.findByUserId(Tutor.userId)).toEqual(null);
    Tutor = await service.ensureByUserId(Tutor.userId, true);
    expect(await service.findByUserId(Tutor.userId, false)).toEqual(Tutor);
    Tutor = await service.ensureByUserId(Tutor.userId, true);
    expect(await service.findByUserId(Tutor.userId, false)).toEqual(Tutor);
    expect(await service.findByUserId(Alice.userId)).toEqual(null);
    await service.ensureByUserId(Alice.userId, false);
    expect(await service.findByUserId(Alice.userId)).toEqual(null);
    const AliceTutor = await service.ensureByUserId(Alice.userId, true);
    expect(await service.findByUserId(Alice.userId, false)).toEqual(AliceTutor);
  });

  // it('chk graduate', async () => {
  //   expect(await service.checkGraduate(Tutor)).toEqual(true);
  //   expect(await service.checkGraduate(Tutor2)).toEqual(false);
  //   await service.approve(Tutor2, false);
  //   expect(await service.checkGraduate(Tutor2)).toEqual(false);
  //   await service.approve(Tutor2, true);
  //   expect(await service.checkGraduate(Tutor2)).toEqual(true);
  //   await service.approve(Tutor2, false);
  //   expect(await service.checkGraduate(Tutor2)).toEqual(true);
  // });

  //检查profile的正确性
  async function chkProfile(
    profile: TutorProfileDto,
    user: TutorEntity,
    publicEmail: boolean,
  ): Promise<void> {
    expect(profile.nominateTime).toEqual(user.nominateTime);
    expect(profile.graduateNewbieCount).toEqual(user.graduateNewbieCount);
    expect(profile.graduationTime).toEqual(user.graduationTime);
    expect(profile.isApproved).toEqual(user.isApproved);
    expect(profile.isGraduate).toEqual(user.isGraduate);
    expect(profile.totalNewbieCount).toEqual(user.totalNewbieCount);
    expect(profile.totalScore).toEqual(user.totalScore);
    expect(profile.userProfile.id).toEqual(user.userId);
    if (!publicEmail) {
      expect(profile.userProfile.email).toBeNull();
    } else {
      expect(profile.userProfile.email).toEqual(
        (await userService.findById(user.userId)).email,
      );
    }
  }

  it('filter profile', async () => {
    await chkProfile(
      await service.filterProfile(Tutor, TutorUser),
      Tutor,
      true,
    );
    await chkProfile(
      await service.getProfileByUserId(Tutor.userId, TutorUser),
      Tutor,
      true,
    );
    await chkProfile(
      await service.filterProfile(Tutor2, TutorUser),
      Tutor2,
      false,
    );
    await chkProfile(
      await service.getProfileByUserId(Tutor2.userId, TutorUser),
      Tutor2,
      false,
    );
    expect(await service.getProfileByUserId(13, Root)).toBeNull();
    expect(await service.getProfileByUserId(Alice.userId, Root)).toBeNull();
  });

  //查找导师列表
  async function chkList(
    skip: number,
    take: number,
    ans: TutorEntity[],
    cnt: number,
    {
      isApproved,
    }: {
      isApproved?: boolean;
    } = {},
  ): Promise<void> {
    const list = await service.getList(skip, take, {
      isApproved: isApproved,
    });

    function removeUserAndTraining(entity: TutorEntity): TutorEntity {
      entity.user = undefined;
      entity.training = undefined;
      return entity;
    }

    expect(list[0].sort().map(removeUserAndTraining)).toEqual(
      ans.sort().map(removeUserAndTraining),
    );
    expect(list[1]).toEqual(cnt);
  }

  it('get list', async () => {
    await chkList(0, 10, [Tutor, Tutor2, Tutor3, Tutor4], 4, {});
    await chkList(0, 10, [], 0, { isApproved: false });
    await chkList(0, 10, [Tutor2, Tutor4], 2, { isApproved: null });
    await chkList(1, 2, [Tutor2, Tutor3], 4, {});
    await chkList(0, 10, [Tutor, Tutor3], 2, { isApproved: true });
    await service.approve(Tutor2, true);
    await chkList(0, 10, [Tutor, Tutor2, Tutor3], 3, { isApproved: true });
    await chkList(1, 1, [Tutor2], 3, { isApproved: true });
    await service.approve(Tutor3, false);
    await chkList(0, 10, [Tutor3], 1, { isApproved: false });
    await chkList(0, 10, [Tutor4], 1, { isApproved: null });
    await service.approve(Tutor2, null);
    await chkList(0, 10, [Tutor], 1, { isApproved: true });
    await chkList(0, 10, [Tutor2, Tutor4], 2, { isApproved: null });
    await service.ensureByUserId(Tutor.userId, false);
    await chkList(0, 10, [], 0, { isApproved: true });
    await service.ensureByUserId(Tutor.userId, true);
    await chkList(0, 10, [Tutor], 1, { isApproved: true });
  });

  //在controller层检查传进来的是不是已经是tutor
  it('nominate', async () => {
    await service.nominate(TutorUser);
    expect((await service.getList(0, 10, {}))[1]).toEqual(4);
    await service.nominate(await userService.findById(Alice.userId));
    expect((await service.getList(0, 10, {}))[1]).toEqual(5);
    await service.ensureByUserId(Tutor.userId, false);
    expect((await service.getList(0, 10, {}))[1]).toEqual(4);
    await service.nominate(TutorUser);
    expect((await service.getList(0, 10, {}))[1]).toEqual(5);
  });

  it('assign and count', async () => {
    expect(Tutor.graduateNewbieCount).toEqual(0);
    expect(Tutor.totalNewbieCount).toEqual(2);
    expect(Tutor2.totalNewbieCount).toEqual(1);
    expect(Tutor3.totalNewbieCount).toEqual(0);
    expect(Tutor4.totalNewbieCount).toEqual(0);
    await newbieService.assignTutor(Dave, Tutor);
    Tutor = await service.findByUserId(Tutor.userId);
    expect(Tutor.totalNewbieCount).toEqual(3);
    await newbieService.assignTutor(Alice, Tutor2);
    Tutor = await service.findByUserId(Tutor.userId);
    Tutor2 = await service.findByUserId(Tutor2.userId);
    expect(Tutor.totalNewbieCount).toEqual(2);
    expect(Tutor2.totalNewbieCount).toEqual(2);
    await newbieService.assignTutor(
      await newbieService.findByUserId(Tutor4.userId),
      Tutor4,
    );
    Tutor4 = await service.findByUserId(Tutor4.userId);
    expect(Tutor4.totalNewbieCount).toEqual(1);
    await newbieService.assignTutor(Alice, Tutor2);
    Tutor2 = await service.findByUserId(Tutor2.userId);
    //TODO: 如果assign自己原来的导师，统计数量时会有问题
    expect(Tutor2.totalNewbieCount).toEqual(2);

    await service.updateNewbieCount(Tutor, 233);
    Tutor = await service.findByUserId(Tutor.userId);
    expect(Tutor.totalNewbieCount).toEqual(235);
    await service.updateNewbieCountByUserId(Tutor.userId, -233);
    Tutor = await service.findByUserId(Tutor.userId);
    expect(Tutor.totalNewbieCount).toEqual(2);
    await service.updateNewbieCountByUserId(Tutor.userId, null);
    Tutor = await service.findByUserId(Tutor.userId);
    expect(Tutor.totalNewbieCount).toEqual(2);
    //2+undefined=nan，但是上层应该会防住所有不是+-1的操作
    //await service.updateNewbieCountByUserId(Tutor.userId, undefined);
    //Tutor = await tutorService.findByUserId(Tutor.userId);
    //expect(Tutor.totalNewbieCount).toEqual(2);
  });

  afterEach(async () => await userRepo.delete({}));
  afterAll(async () => await connection.close());
});
