import { Test, TestingModule } from '@nestjs/testing';
import { TutorController } from './tutor.controller';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { TutorEntity } from './tutor.entity';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TutorService } from './tutor.service';
import { Connection, Repository } from 'typeorm';
import { Role } from '../common/role';
import { UserEntity } from '../user/user.entity';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import * as bcrypt from 'bcrypt';
import { NewbieEntity } from '../newbie/newbie.entity';
import { NewbieService } from '../newbie/newbie.service';
import { GetTutorProfileError, TutorStatus } from './dto';
import { PermissionModule } from '../permission/permission.module';
import { TagModule } from '../tag/tag.module';
import { TemplateModule } from '../template/template.module';
import { ExamModule } from '../exam/exam.module';
import { TaskModule } from '../task/task.module';
import { CourseModule } from '../course/course.module';
import { FileModule } from '../file/file.module';
import { NewbieModule } from '../newbie/newbie.module';
import { TutorAwardEntity } from './tutor-award.entity';
import { TutorAwardService } from './tutur-award.service';
import { WildcardType } from '../common/dto';
import { DevService } from '../dev/dev.service';
import { DivisionEntity } from '../tag/tag-division.entity';
import { CityEntity } from '../tag/tag-city.entity';
import { DevModule } from '../dev/dev.module';

describe('TutorController', () => {
  let controller: TutorController;
  let connection: Connection;
  let userService: UserService;
  let newbieService: NewbieService;
  let tutorService: TutorService;
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;
  let newbieRepo: Repository<NewbieEntity>;
  let tutorRepo: Repository<TutorEntity>;

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
  let Admin: UserEntity;
  let AliceUser: UserEntity;
  let devService: DevService;
  let division: DivisionEntity;
  let city: CityEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([
          TutorEntity,
          TutorAwardEntity,
          DivisionEntity,
          CityEntity,
        ]),
        ConfigModule,
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        forwardRef(() => AuthModule),
        forwardRef(() => PermissionModule),
        forwardRef(() => TagModule),
        forwardRef(() => TemplateModule),
        forwardRef(() => ExamModule),
        forwardRef(() => TaskModule),
        forwardRef(() => CourseModule),
        forwardRef(() => FileModule),
        forwardRef(() => NewbieModule),
        forwardRef(() => DevModule),
        forwardRef(() => TagModule),
      ],
      providers: [TutorService, TutorAwardService],
      controllers: [TutorController],
    }).compile();

    controller = module.get<TutorController>(TutorController);
    connection = module.get<Connection>(Connection);
    userService = module.get<UserService>(UserService);
    newbieService = module.get<NewbieService>(NewbieService);
    tutorService = module.get<TutorService>(TutorService);
    devService = module.get<DevService>(DevService);

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
    divisionId: number,
    cityId: number,
  ): Promise<[UserEntity, UserAuthEntity]> {
    const Alice = await userService.create({
      username: userName,
      realname: realName,
      email: Email,
      publicEmail: false,
      roles: Roles,
      password: undefined,
      cityId,
      divisionId,
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
    division = (await devService.addDivision(1, 'division'))[1];
    city = (await devService.addCity(1, 'city'))[1];
    Root = (
      await createUser(
        1,
        'Root',
        'root',
        'root@null',
        [Role.ADMIN],
        'root-pass',
        true,
        division.id,
        city.id,
      )
    )[0];
    Tutor = await tutorService.findByUserId(
      (
        await createUser(
          2,
          'Tutor',
          'tutor',
          'tutor@null',
          [Role.TUTOR],
          'tutor-pass',
          false,
          division.id,
          city.id,
        )
      )[0].id,
    );
    Tutor.isApproved = true;
    Tutor.isGraduate = true;
    Tutor = await tutorRepo.save(Tutor);
    TutorUser = await userService.findById(Tutor.userId);
    Tutor2 = await tutorService.findByUserId(
      (
        await createUser(
          3,
          'Tutor2',
          'tutor2',
          'tutor2@null',
          [Role.TUTOR],
          'tutor2-pass',
          false,
          division.id,
          city.id,
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
          division.id,
          city.id,
        )
      )[0].id,
    );
    Alice = await newbieService.assignTutor(Alice, Tutor);
    AliceUser = await userService.findById(Alice.userId);

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
          division.id,
          city.id,
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
          division.id,
          city.id,
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
          division.id,
          city.id,
        )
      )[0].id,
    );

    Tutor3 = await tutorService.findByUserId(
      (
        await createUser(
          8,
          'Tutor3',
          'tutor3',
          'tutor3@null',
          [Role.TUTOR],
          'tutor3-pass',
          false,
          division.id,
          city.id,
        )
      )[0].id,
    );
    Tutor3.isApproved = true;
    Tutor3.isGraduate = true;
    Tutor3 = await tutorRepo.save(Tutor3);

    Tutor4 = await tutorService.findByUserId(
      (
        await createUser(
          9,
          'Tutor4',
          'tutor4',
          'tutor4@null',
          [Role.TUTOR, Role.NEWBIE, Role.HRBP],
          'tutor4-pass',
          false,
          division.id,
          city.id,
        )
      )[0].id,
    );
    Tutor4 = await tutorRepo.save(Tutor4);

    Admin = (
      await createUser(
        10,
        'Admin',
        'admin',
        'admin@null',
        [Role.ADMIN],
        'admin-pass',
        false,
        division.id,
        city.id,
      )
    )[0];
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('cover', async () => {
    expect(
      await controller.getTutorDataShow(Root, {
        startTime: '2022-04',
        endTime: '2022-05',
      }),
    );
    expect(
      await controller.getTutorDataShow(Admin, {
        startTime: '2022-04',
        endTime: '2022-05',
      }),
    );
    expect(
      await controller.getTutorDataShow(
        await userService.findById(Tutor.userId),
        {
          startTime: '2022-04',
          endTime: '2022-05',
        },
      ),
    );
    expect(
      await controller.getTutors(Root, {
        // cityId: 0,
        currentRole: Role.ADMIN,
        // divisionId: 0,
        keyword: '',
        pendingFirst: true,
        skip: 5,
        status: TutorStatus.pending,
        take: 10,
        wildcard: WildcardType.BEGIN,
      }),
    );
    expect(
      await controller.getAwardsOfTutor(
        await userService.findById(Tutor.userId),
        Tutor.userId,
      ),
    );
    expect(await controller.getAwardsOfTutor(Root, Tutor.userId));
    expect(
      await controller.getAwardsOfTutor(
        await userService.findById(Alice.userId),
        Tutor.userId,
      ),
    );
    expect(
      await controller.approveTutor(Root, Tutor2.userId, { approve: false }),
    );
    expect(
      await controller.approveTutor(Root, Tutor2.userId, { approve: true }),
    );
    expect(
      await controller.approveTutor(Root, Tutor2.userId, { approve: false }),
    );
    expect(
      await controller.giveAwardToTutor(Root, Tutor2.userId, {
        title: 'title',
        description: 'description',
        level: 1,
      }),
    );
    expect(
      await controller.getAwardsOfTutor(
        await userService.findById(Alice.userId),
        Tutor.userId,
      ),
    );
  });
  // it('has permission on newbie', async () => {
  //   expect(controller.hasPermissionOnTutor(Root, Tutor)).toEqual(true);
  //   expect(controller.hasPermissionOnTutor(Admin, Tutor)).toEqual(true);
  //   expect(controller.hasPermissionOnTutor(TutorUser, Tutor)).toEqual(true);
  //   expect(controller.hasPermissionOnTutor(TutorUser, Tutor)).toEqual(true);
  //   expect(controller.hasPermissionOnTutor(AliceUser, Tutor)).toEqual(false);
  //   expect(controller.hasPermissionOnTutor(TutorUser, Tutor2)).toEqual(false);
  //   await tutorService.nominate(AliceUser);
  //   const AliceTutor = await tutorService.findByUserId(Alice.userId);
  //   expect(controller.hasPermissionOnTutor(Root, AliceTutor)).toEqual(true);
  // });

  //检查profile的正确性
  // async function chkProfile(
  //   profile: TutorProfileDto,
  //   user: TutorEntity,
  //   publicEmail: boolean,
  // ): Promise<void> {
  //   expect(profile.nominateTime).toEqual(user.nominateTime);
  //   expect(profile.graduateNewbieCount).toEqual(user.graduateNewbieCount);
  //   expect(profile.graduationTime).toEqual(user.graduationTime);
  //   expect(profile.isApproved).toEqual(user.isApproved);
  //   expect(profile.isGraduate).toEqual(user.isGraduate);
  //   expect(profile.totalNewbieCount).toEqual(user.totalNewbieCount);
  //   expect(profile.training).toEqual(user.training);
  //   expect(profile.totalScore).toEqual(user.totalScore);
  //   expect(profile.training).toEqual(user.training);
  //   expect(profile.userProfile.id).toEqual(user.userId);
  //   if (!publicEmail) {
  //     expect(profile.userProfile.email).toBeNull();
  //   } else {
  //     expect(profile.userProfile.email).toEqual(
  //       (await userService.findById(user.userId)).email,
  //     );
  //   }
  // }

  it('get tutor profile', async () => {
    expect(await controller.getTutorProfile(null, Tutor.userId)).toEqual({
      error: GetTutorProfileError.PERMISSION_DENIED,
    });
    expect(await controller.getTutorProfile(Root, Alice.userId)).toEqual({
      error: GetTutorProfileError.NO_SUCH_TUTOR,
    });
    expect(await controller.getTutorProfile(Root, 12)).toEqual({
      error: GetTutorProfileError.NO_SUCH_TUTOR,
    });
    // expect(await controller.getTutorProfile(TutorUser, Tutor2.userId)).toEqual({
    //   error: GetTutorProfileError.PERMISSION_DENIED,
    // });
    // await chkProfile(
    //   (
    //     await controller.getTutorProfile(TutorUser, Tutor.userId)
    //   ).profile,
    //   Tutor,
    //   true,
    // );
    // await chkProfile(
    //   (
    //     await controller.getTutorProfile(Admin, Tutor.userId)
    //   ).profile,
    //   Tutor,
    //   true,
    // );
    // await chkProfile(
    //   (
    //     await controller.getTutorProfile(
    //       await userService.findById(Tutor4.userId),
    //       Tutor.userId,
    //     )
    //   ).profile,
    //   Tutor,
    //   false,
    // );
    // await tutorService.ensureByUserId(Tutor.userId, false);
    // expect(await controller.getTutorProfile(Root, Tutor.userId)).toEqual({
    //   error: GetTutorProfileError.NO_SUCH_TUTOR,
    // });
    // await tutorService.ensureByUserId(Tutor.userId, true);
    // await chkProfile(
    //   (
    //     await controller.getTutorProfile(Root, Tutor.userId)
    //   ).profile,
    //   Tutor,
    //   true,
    // );
  });

  //it('get tutor newbies', async () => {
  //TODO: 没有测assigned这一属性
  //   expect(
  //     await controller.getTutorNewbies(null, Tutor.userId, {
  //       skip: 0,
  //       take: 10,
  //     }),
  //   ).toEqual({ error: GetTutorNewbiesError.PERMISSION_DENIED });
  //   expect(
  //     await controller.getTutorNewbies(Root, Alice.userId, {
  //       skip: 0,
  //       take: 10,
  //     }),
  //   ).toEqual({ error: GetTutorNewbiesError.NO_SUCH_TUTOR });
  //   expect(
  //     await controller.getTutorNewbies(Root, 12, { skip: 0, take: 10 }),
  //   ).toEqual({ error: GetTutorNewbiesError.NO_SUCH_TUTOR });
  //   expect(
  //     await controller.getTutorNewbies(TutorUser, Tutor4.userId, {
  //       skip: 0,
  //       take: 10,
  //     }),
  //   ).toEqual({ error: GetTutorNewbiesError.PERMISSION_DENIED });
  //   expect(
  //     await controller.getTutorNewbies(Root, Tutor2.userId, {
  //       skip: 0,
  //       take: 10,
  //     }),
  //   ).toEqual({ error: GetTutorNewbiesError.TUTOR_NOT_APPROVED });
  //   //TODO：没有测到TUTOR_NOT_GRADUATE
  //   expect(
  //     await controller.getTutorNewbies(Root, Tutor.userId, {
  //       skip: 0,
  //       take: 101,
  //     }),
  //   ).toEqual({ error: GetTutorNewbiesError.TAKE_TOO_MANY });
  //   await tutorService.approve(Tutor2, false);
  //   expect(
  //     await controller.getTutorNewbies(Root, Tutor2.userId, {
  //       skip: 0,
  //       take: 10,
  //     }),
  //   ).toEqual({ error: GetTutorNewbiesError.TUTOR_NOT_APPROVED });
  //   await tutorService.approve(Tutor2, true);
  //   await tutorService.approve(Tutor4, true);
  //   const AlicePro = await newbieService.filterProfile(Alice, Root, false);
  //   const BobPro = await newbieService.filterProfile(Bob, Root, false);
  //   const CarolPro = await newbieService.filterProfile(Carol, Root, false);
  //   const DavePro = await newbieService.filterProfile(Dave, Root, false);
  //   const AliceProNotEmail = await newbieService.filterProfile(
  //     Alice,
  //     TutorUser,
  //     false,
  //   );
  //
  //   function expectList(
  //     res: GetTutorNewbiesResponseDto,
  //     list: NewbieProfileDto[],
  //     count: number,
  //   ) {
  //     expect(res).toEqual({
  //       newbies: list.map((profile) => {
  //         profile.training = undefined;
  //         return profile;
  //       }),
  //       count,
  //     });
  //   }
  //
  //   expectList(
  //     await controller.getTutorNewbies(Root, Tutor.userId, { take: 10 }),
  //     [AlicePro, BobPro],
  //     2,
  //   );
  //   expectList(
  //     await controller.getTutorNewbies(Root, Tutor2.userId, {
  //       take: 10,
  //     }),
  //     [CarolPro],
  //     1,
  //   );
  //   expectList(
  //     await controller.getTutorNewbies(Root, Tutor3.userId, {
  //       take: 10,
  //     }),
  //     [],
  //     0,
  //   );
  //   await newbieService.assignTutor(Bob, Tutor2);
  //   expectList(
  //     await controller.getTutorNewbies(TutorUser, Tutor.userId, { take: 10 }),
  //     [AliceProNotEmail],
  //     1,
  //   );
  //   await newbieService.assignTutor(Bob, Tutor);
  //   await newbieService.assignTutor(Carol, Tutor);
  //   await newbieService.assignTutor(Dave, Tutor);
  //   expectList(
  //     await controller.getTutorNewbies(Root, Tutor.userId, { take: 10 }),
  //     [AlicePro, BobPro, CarolPro, DavePro],
  //     4,
  //   );
  //   expectList(
  //     await controller.getTutorNewbies(Root, Tutor.userId, {
  //       skip: 1,
  //       take: 2,
  //     }),
  //     [BobPro, CarolPro],
  //     4,
  //   );
  //   await newbieService.assignTutor(Alice, Tutor);
  //   await newbieService.assignTutor(Bob, Tutor4);
  //   const Tutor4Newbie = await newbieService.findByUserId(Tutor4.userId);
  //   const Tutor4Pro = await newbieService.filterProfile(
  //     Tutor4Newbie,
  //     Root,
  //     false,
  //   );
  //   await newbieService.assignTutor(Tutor4Newbie, Tutor4);
  //   expectList(
  //     await controller.getTutorNewbies(Root, Tutor4.userId, {
  //       take: 10,
  //     }),
  //     [BobPro, Tutor4Pro],
  //     2,
  //   );
  // });

  afterEach(async () => await userRepo.delete({}));
  afterAll(async () => await connection.close());
});
