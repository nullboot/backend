import { Test, TestingModule } from '@nestjs/testing';
import { NewbieController } from './newbie.controller';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NewbieService } from './newbie.service';
import { NewbieEntity } from './newbie.entity';
import { Connection, Repository } from 'typeorm';
import { UserModule } from '../user/user.module';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import * as bcrypt from 'bcrypt';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { TutorEntity } from '../tutor/tutor.entity';
import { TutorService } from '../tutor/tutor.service';
import { UserService } from '../user/user.service';
import { TutorModule } from '../tutor/tutor.module';
import { GetNewbieProfileError, NewbieStatus } from './dto';
import { ExamModule } from '../exam/exam.module';
import { PermissionModule } from '../permission/permission.module';
import { TagModule } from '../tag/tag.module';
import { TemplateModule } from '../template/template.module';
import { TaskModule } from '../task/task.module';
import { CourseModule } from '../course/course.module';
import { NewbieCommentService } from './newbie-comment.service';
import {
  NewbieCommentEntity,
  NewbieCommentType,
} from './newbie-comment.entity';
import { WildcardType } from '../common/dto';
import { NewbieCommentController } from './newbie-comment.controller';

describe('NewbieController', () => {
  let controller: NewbieController;
  let commentController: NewbieCommentController;
  let commentService: NewbieCommentService;
  let connection: Connection;
  let Alice: NewbieEntity;
  let AliceUser: UserEntity;
  let Bob: NewbieEntity;
  let Carol: NewbieEntity;
  let Tutor: TutorEntity;
  let TutorUser: UserEntity;
  let Tutor2: TutorEntity;
  let Root: UserEntity;
  let Admin: UserEntity;
  let userRepo: Repository<UserEntity>;
  let tutorRepo: Repository<TutorEntity>;
  let userService: UserService;
  let newbieRepo: Repository<NewbieEntity>;
  let newbieService: NewbieService;
  let tutorService: TutorService;
  let userAuthRepo: Repository<UserAuthEntity>;

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
      publicEmail: true,
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

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([NewbieEntity, NewbieCommentEntity]),
        ConfigModule,
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
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

    controller = module.get<NewbieController>(NewbieController);
    commentController = module.get<NewbieCommentController>(
      NewbieCommentController,
    );
    connection = module.get<Connection>(Connection);
    userService = module.get<UserService>(UserService);
    newbieService = module.get<NewbieService>(NewbieService);
    commentService = module.get<NewbieCommentService>(NewbieCommentService);
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
    Tutor = await tutorService.findByUserId(
      (
        await createUser(
          2,
          'AliceTutor',
          'aliceTutor',
          'alicetutor@null',
          [Role.TUTOR],
          'alice-tutor-pass',
          false,
        )
      )[0].id,
    );
    await tutorService.approve(Tutor, true);
    Tutor.isApproved = true;
    Tutor.isGraduate = true;
    Tutor = await tutorRepo.save(Tutor);
    TutorUser = await userService.findById(Tutor.userId);

    Alice = await newbieService.findByUserId(
      (
        await createUser(
          3,
          'Alice',
          'alice',
          'alice@null',
          [Role.NEWBIE],
          'alice-pass',
          false,
        )
      )[0].id,
    );
    // Alice.tutorId = Tutor.userId;
    // Alice = await newbieRepo.save(Alice);
    await newbieService.assignTutor(Alice, Tutor);
    AliceUser = await userService.findById(Alice.userId);

    Tutor2 = await tutorService.findByUserId(
      (
        await createUser(
          4,
          'BobTutor',
          'bobTutor',
          'bobTutor@null',
          [Role.TUTOR],
          'bob-tutor-pass',
          false,
        )
      )[0].id,
    );
    await tutorService.approve(Tutor2, true);
    Tutor2.isApproved = true;
    Tutor2.isGraduate = true;
    Tutor2 = await tutorRepo.save(Tutor2);

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
    Bob.tutorId = Tutor2.userId;
    Bob = await newbieRepo.save(Bob);

    Carol = await newbieService.findByUserId(
      (
        await createUser(
          6,
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

    Admin = (
      await createUser(
        8,
        'Admin',
        'admin',
        'admin@null',
        [Role.ADMIN],
        'admin-pass',
        false,
      )
    )[0];
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // it('has permission on newbie', async () => {
  //   expect(controller.hasPermissionOnNewbie(Root, Alice)).toEqual(true);
  //   expect(controller.hasPermissionOnNewbie(Admin, Alice)).toEqual(true);
  //   expect(controller.hasPermissionOnNewbie(AliceUser, Alice)).toEqual(true);
  //   expect(controller.hasPermissionOnNewbie(TutorUser, Alice)).toEqual(true);
  //   expect(controller.hasPermissionOnNewbie(AliceUser, Bob)).toEqual(false);
  //   expect(controller.hasPermissionOnNewbie(TutorUser, Bob)).toEqual(false);
  //   expect(controller.hasPermissionOnNewbie(TutorUser, Carol)).toEqual(false);
  //   await newbieService.assignTutor(Carol, Tutor);
  //   expect(controller.hasPermissionOnNewbie(TutorUser, Carol)).toEqual(true);
  // });

  it('get newbie profile', async () => {
    expect(await controller.getNewbieProfile(null, Alice.userId)).toEqual({
      error: GetNewbieProfileError.PERMISSION_DENIED,
    });
    expect(await controller.getNewbieProfile(Root, Tutor.userId)).toEqual({
      error: GetNewbieProfileError.NO_SUCH_NEWBIE,
    });
    expect(await controller.getNewbieProfile(Root, 233)).toEqual({
      error: GetNewbieProfileError.NO_SUCH_NEWBIE,
    });
    expect(await controller.getNewbieProfile(AliceUser, Bob.userId)).toEqual({
      error: GetNewbieProfileError.PERMISSION_DENIED,
    });

    const profile = await (
      await controller.getNewbieProfile(Root, Alice.userId)
    ).profile;
    expect(profile.userId).toEqual(Alice.userId);
    expect(profile.graduationTime).toEqual(Alice.graduationTime);
    expect(profile.tutorProfile).toEqual(
      await tutorService.filterProfile(Tutor, AliceUser),
    );
    expect(profile.graduationTime).toEqual(Alice.graduationTime);
    expect(profile.isAssigned).toEqual(Alice.isAssigned);
    expect(profile.isGraduate).toEqual(Alice.isGraduate);
    expect(profile.onBoarding).toEqual(Alice.onBoarding);
    expect(profile.userProfile.id).toEqual(Alice.userId);
    expect(profile.userProfile.email).toEqual(AliceUser.email);
  });

  it('cover', async () => {
    expect(
      await controller.getNewbieDataShow(Root, {
        startTime: '2022-04',
        endTime: '2022-05',
      }),
    );
    expect(
      await controller.getNewbieDataShow(
        await userService.findById(Tutor.userId),
        {
          startTime: '2022-04',
          endTime: '2022-05',
        },
      ),
    );
    expect(
      await controller.getNewbieDataShow(Admin, {
        startTime: '2022-04',
        endTime: '2022-05',
      }),
    );
    expect(
      await controller.getNewbieDataShow(
        await userService.findById(Tutor.userId),
        {
          startTime: '2022-04',
          endTime: '2022-05',
        },
      ),
    );
    expect(
      await controller.getNewbies(Root, {
        // cityId: 0,
        currentRole: Role.ADMIN,
        // divisionId: 0,
        getComments: true,
        keyword: '',
        pendingFirst: true,
        skip: 5,
        status: NewbieStatus.pending,
        take: 10,
        tutorId: Tutor2.userId,
        wildcard: WildcardType.BEGIN,
      }),
    );
    expect(
      await controller.getNewbieTemplate(
        await userService.findById(Tutor.userId),
        Alice.userId,
      ),
    );
    expect(
      await controller.getNewbieTemplate(
        await userService.findById(Tutor.userId),
        Bob.userId,
      ),
    );
    expect(
      await commentController.GetNewbieComment(Root, Alice.userId, {
        type: NewbieCommentType.TutorToNewbie,
      }),
    );
    Alice.isAssigned = true;
    Alice = await newbieRepo.save(Alice);
    expect(
      await commentController.UpdateNewbieComment(Root, Alice.userId, {
        content: 'good',
        score: 60,
        type: NewbieCommentType.NewbieToTutor,
      }),
    );
    expect(
      await commentController.deleteNewbieComment(
        Root,
        Alice.userId,
        (
          await commentService.findOneByNewbieId(
            Alice.userId,
            NewbieCommentType.NewbieToTutor,
          )
        ).id,
      ),
    );
  });

  afterEach(async () => await userRepo.delete({}));
  afterAll(async () => await connection.close());
});
