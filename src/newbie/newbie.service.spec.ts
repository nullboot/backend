import { Test, TestingModule } from '@nestjs/testing';
import { NewbieService } from './newbie.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NewbieEntity } from './newbie.entity';
import { Connection, Repository } from 'typeorm';
import { UserModule } from '../user/user.module';
import { TutorModule } from '../tutor/tutor.module';
import { TutorService } from '../tutor/tutor.service';
import { UserService } from '../user/user.service';
import { TutorEntity } from '../tutor/tutor.entity';
import { UserEntity } from '../user/user.entity';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { AuthModule } from '../auth/auth.module';
import { Role } from '../common/role';
import * as bcrypt from 'bcrypt';
import { NewbieController } from './newbie.controller';
import { ExamModule } from '../exam/exam.module';
import { NewbieProfileDto } from './dto';
import { PermissionModule } from '../permission/permission.module';
import { TagModule } from '../tag/tag.module';
import { TemplateModule } from '../template/template.module';
import { TaskModule } from '../task/task.module';
import { CourseModule } from '../course/course.module';
import { NewbieCommentService } from './newbie-comment.service';
import { NewbieCommentEntity } from './newbie-comment.entity';

describe('NewbieService', () => {
  let service: NewbieService;
  let connection: Connection;
  let userService: UserService;
  let tutorService: TutorService;
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let newbieRepo: Repository<NewbieEntity>;
  let tutorRepo: Repository<TutorEntity>;
  let Alice: NewbieEntity;
  let Bob: NewbieEntity;
  let Carol: NewbieEntity;
  let Dave: NewbieEntity;
  let AliceUser: UserEntity;
  let Root: UserEntity;
  let Tutor: TutorEntity;
  let Tutor2: TutorEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([NewbieEntity, NewbieCommentEntity]),
        ConfigModule,
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        forwardRef(() => AuthModule),
        forwardRef(() => TutorModule),
        forwardRef(() => ExamModule),
        forwardRef(() => TaskModule),
        forwardRef(() => CourseModule),
        forwardRef(() => PermissionModule),
        forwardRef(() => TagModule),
        forwardRef(() => TemplateModule),
      ],
      providers: [NewbieService, NewbieCommentService],
      controllers: [NewbieController],
    }).compile();

    service = module.get<NewbieService>(NewbieService);
    connection = module.get<Connection>(Connection);
    userService = module.get<UserService>(UserService);
    tutorService = module.get<TutorService>(TutorService);

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
        'root@null.com',
        [Role.ADMIN],
        'root-pass',
        true,
      )
    )[0];
    Tutor = await tutorService.findByUserId(
      (
        await createUser(
          2,
          'Tutor',
          'tutor',
          'tutor@null.com',
          [Role.TUTOR],
          'tutor-pass',
          false,
        )
      )[0].id,
    );
    Tutor = await tutorService.approve(Tutor, true);
    Tutor.isApproved = true;
    Tutor.isGraduate = true;
    Tutor = await tutorRepo.save(Tutor);

    AliceUser = (
      await createUser(
        3,
        'Alice',
        'alice',
        'alice@null.com',
        [Role.NEWBIE],
        'alice-pass',
        false,
      )
    )[0];
    Alice = await service.findByUserId(AliceUser.id);
    Alice.tutorId = Tutor.userId;
    Alice = await newbieRepo.save(Alice);

    Bob = await service.findByUserId(
      (
        await createUser(
          4,
          'Bob',
          'bob',
          'bob@null.com',
          [Role.NEWBIE],
          'bob-pass',
          false,
        )
      )[0].id,
    );
    Bob = await newbieRepo.save(Bob);

    Carol = await service.findByUserId(
      (
        await createUser(
          5,
          'Carol',
          'carol',
          'carol@null.com',
          [Role.NEWBIE],
          'carol-pass',
          false,
        )
      )[0].id,
    );
    Carol = await newbieRepo.save(Carol);

    Dave = await service.findByUserId(
      (
        await createUser(
          6,
          'Dave',
          'dave',
          'dave@null.com',
          [Role.NEWBIE],
          'dave-pass',
          false,
        )
      )[0].id,
    );
    Dave = await newbieRepo.save(Dave);

    Tutor2 = await tutorService.findByUserId(
      (
        await createUser(
          7,
          'Tutor2',
          'tutor2',
          'tutor2@null.com',
          [Role.TUTOR],
          'tutor2-pass',
          false,
        )
      )[0].id,
    );
    Tutor2 = await tutorService.approve(Tutor2, true);
    Tutor2.isApproved = true;
    Tutor2.isGraduate = true;
    Tutor2 = await tutorRepo.save(Tutor2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('test isExist', async () => {
    expect(await service.findByUserId(Alice.userId)).toEqual(Alice);
    await service.ensureByUserId(Alice.userId, false);
    expect(await service.findByUserId(Alice.userId)).toEqual(null);
    Alice = await service.ensureByUserId(Alice.userId, true);
    expect(await service.findByUserId(Alice.userId, false)).toEqual(Alice);
  });

  function removeDate(user: UserEntity): UserEntity {
    user.registerTime = null;
    return user;
  }

  it('find user', async () => {
    expect(removeDate(await userService.findById(Alice.userId))).toEqual(
      removeDate(AliceUser),
    );
    expect(
      removeDate((await service.findByUserId(AliceUser.id, true)).user),
    ).toEqual(removeDate(AliceUser));
  });

  //检查profile的正确性
  async function chkProfile(
    profile: NewbieProfileDto,
    user: NewbieEntity,
    publicTutor: boolean,
    publicEmail: boolean,
  ): Promise<void> {
    expect(profile.userId).toEqual(user.userId);
    expect(profile.graduationTime).toEqual(user.graduationTime);
    if (!publicTutor) {
      expect(profile.tutorProfile).toBeNull();
    } else {
      expect(profile.tutorProfile.userId).toEqual(user.tutorId);
    }
    expect(profile.graduationTime).toEqual(user.graduationTime);
    expect(profile.isAssigned).toEqual(user.isAssigned);
    expect(profile.isGraduate).toEqual(user.isGraduate);
    expect(profile.onBoarding).toEqual(user.onBoarding);
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
      await service.filterProfile(Alice, AliceUser, true),
      Alice,
      true,
      true,
    );
    await chkProfile(
      await service.filterProfile(Alice, AliceUser),
      Alice,
      true,
      true,
    );
    await chkProfile(
      await service.filterProfile(Bob, AliceUser, true),
      Bob,
      false,
      false,
    );
  });

  //给新人安排导师，注意这里直接传的是NewbieEntity和TutorEntity，没有判这个人是不是新人/导师，这个判断在controller层进行
  it('assign tutor', async () => {
    expect((await service.findByUserId(Alice.userId)).tutorId).toEqual(
      Tutor.userId,
    );
    await service.assignTutor(Bob, Tutor);
    expect((await service.findByUserId(Bob.userId)).tutorId).toEqual(
      Tutor.userId,
    );
    await service.assignTutor(Alice, Tutor2);
    expect((await service.findByUserId(Alice.userId)).tutorId).toEqual(
      Tutor2.userId,
    );
  });

  //查找新人列表
  async function chkList(
    skip: number,
    take: number,
    ans: NewbieEntity[],
    cnt: number,
    tutor: number,
    isAssigned = false,
    //TODO: 因为目前还没有写好任务，这里的isAssigned默认为false，将来写好之后要增加测试
  ): Promise<void> {
    const list = await service.getList(skip, take, {
      tutorId: tutor,
      isAssigned: isAssigned,
    });

    function removeUserAndTraining(entity: NewbieEntity): NewbieEntity {
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
    await chkList(0, 10, [Alice, Bob, Carol, Dave], 4, null);
    await chkList(1, 2, [Bob, Carol], 4, null);
    await service.assignTutor(Bob, Tutor);
    await chkList(0, 10, [Alice, Bob], 2, Tutor.userId);
    await service.assignTutor(Carol, Tutor);
    await service.assignTutor(Dave, Tutor2);
    await chkList(0, 10, [Alice, Bob, Carol], 3, Tutor.userId);
    await chkList(0, 10, [Dave], 1, Tutor2.userId);
    await chkList(1, 1, [Bob], 3, Tutor.userId);
    await service.assignTutor(Alice, Tutor2);
    await chkList(0, 10, [Bob, Carol], 2, Tutor.userId);
    await chkList(0, 10, [Alice, Dave], 2, Tutor2.userId);
    await service.assignTutor(Alice, Tutor);
    await chkList(0, 10, [Alice, Bob, Carol], 3, Tutor.userId);
    await chkList(0, 10, [Dave], 1, Tutor2.userId);
  });

  afterEach(async () => await userRepo.delete({}));
  afterAll(async () => await connection.close());
});
