import { Test, TestingModule } from '@nestjs/testing';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseSectionService } from './course-section.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './course.entity';
import {
  CourseSectionEntity,
  CourseSectionType,
} from './course-section.entity';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import { v4 as UUID } from 'uuid';
import {
  CourseRequestDto,
  CourseSectionRequestDto,
  CreateCourseError,
  CreateCourseSectionError,
  DeleteCourseError,
  DeleteCourseSectionError,
  GetCourseError,
  GetCourseSectionError,
  GetCourseSectionsRequestDto,
  GetCoursesError,
  GetCoursesRequestDto,
  UpdateCourseError,
  UpdateCourseSectionError,
} from './dto';
import { DefaultPaginateError } from '../common/types';
import { FileEntity } from '../file/file.entity';
import { WildcardType } from '../common/dto';

describe('CourseController', () => {
  let controller: CourseController;
  let connection: Connection;
  let Root: UserEntity;
  let User: UserEntity;
  let Admin: UserEntity;
  let File: FileEntity;
  let CourseReq: CourseRequestDto;
  let SectionReq: CourseSectionRequestDto;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        forwardRef(() => DatabaseModule),
        TypeOrmModule.forFeature([CourseEntity, CourseSectionEntity]),
        forwardRef(() => FileModule),
        forwardRef(() => UserModule),
      ],
      controllers: [CourseController],
      providers: [CourseService, CourseSectionService],
    }).compile();

    controller = module.get<CourseController>(CourseController);
    connection = module.get<Connection>(Connection);
    await clearDatabase();
  });

  async function clearDatabase() {
    await connection.getRepository(CourseEntity).delete({});
    await connection.getRepository(CourseSectionEntity).delete({});
    await connection.getRepository(UserEntity).delete({});
    await connection.getRepository(FileEntity).delete({});
  }

  async function createUser(
    username: string,
    roles: Role[],
    isRoot = false,
  ): Promise<UserEntity> {
    return await connection.getRepository(UserEntity).save({
      username: username,
      realname: username,
      email: `${username}@null.boot`,
      publicEmail: true,
      isRoot,
      roles,
    });
  }

  beforeEach(async () => {
    Root = await createUser('root', [], true);
    User = await createUser('user', []);
    Admin = await createUser('admin', [Role.ADMIN]);
    File = await connection.getRepository(FileEntity).save({
      uuid: UUID(),
      size: 0,
      uploadTime: new Date(),
    });
    CourseReq = {
      title: 'Test Course',
      description: 'Test Course Description',
      sectionIds: [],
      tags: [],
    };
    SectionReq = {
      title: 'Test Section',
      description: 'Test Section Description',
      fileId: File.id,
      filename: 'Test Section File',
      type: CourseSectionType.VIDEO,
    };
  });

  it('create course', async () => {
    const { section } = await controller.createCourseSection(Root, SectionReq);

    expect(await controller.createCourse(null, CourseReq)).toEqual({
      error: CreateCourseError.PERMISSION_DENIED,
    });
    expect(await controller.createCourse(User, CourseReq)).toEqual({
      error: CreateCourseError.PERMISSION_DENIED,
    });

    expect(
      await controller.createCourse(Admin, {
        ...CourseReq,
        sectionIds: [-1],
      }),
    ).toEqual({
      error: CreateCourseError.INVALID_SECTION,
    });

    const { course } = await controller.createCourse(Root, CourseReq);
    expect(course).toBeDefined();

    const { course: course2 } = await controller.createCourse(Root, {
      ...CourseReq,
      sectionIds: [section.id],
    });
    expect(course2).toBeDefined();
  });

  it('get course', async () => {
    const { course } = await controller.createCourse(Root, CourseReq);

    expect(await controller.getCourse(null, course.id)).toEqual({
      error: GetCourseError.PERMISSION_DENIED,
    });
    expect(await controller.getCourse(User, course.id)).toEqual({
      error: GetCourseError.PERMISSION_DENIED,
    });

    expect(await controller.getCourse(Root, -1)).toEqual({
      error: GetCourseError.NO_SUCH_COURSE,
    });

    expect(await controller.getCourse(Admin, course.id)).toEqual({
      course,
    });
  });

  it('update course', async () => {
    const { course } = await controller.createCourse(Root, CourseReq);

    expect(await controller.updateCourse(null, course.id, CourseReq)).toEqual({
      error: UpdateCourseError.PERMISSION_DENIED,
    });
    expect(await controller.updateCourse(User, course.id, CourseReq)).toEqual({
      error: UpdateCourseError.PERMISSION_DENIED,
    });
    expect(await controller.updateCourse(Admin, course.id, CourseReq)).toEqual({
      error: UpdateCourseError.PERMISSION_DENIED,
    });

    expect(await controller.updateCourse(Root, -1, CourseReq)).toEqual({
      error: UpdateCourseError.NO_SUCH_COURSE,
    });

    expect(
      await controller.updateCourse(Root, course.id, {
        ...CourseReq,
        sectionIds: [-1],
      }),
    ).toEqual({
      error: UpdateCourseError.INVALID_SECTION,
    });

    expect(
      await controller.updateCourse(Root, course.id, {
        ...CourseReq,
        sectionIds: [],
      }),
    ).toEqual({
      course,
    });

    expect(
      await controller.updateCourse(Root, course.id, {
        ...CourseReq,
        tags: ['test'],
        title: 'Updated Title',
      }),
    ).toEqual({
      course: {
        ...course,
        title: 'Updated Title',
        tags: ['test'],
      },
    });
  });

  it('delete course', async () => {
    const { course } = await controller.createCourse(Root, CourseReq);

    expect(await controller.deleteCourse(null, course.id)).toEqual({
      error: DeleteCourseError.PERMISSION_DENIED,
    });
    expect(await controller.deleteCourse(User, course.id)).toEqual({
      error: DeleteCourseError.PERMISSION_DENIED,
    });
    expect(await controller.deleteCourse(Admin, course.id)).toEqual({
      error: DeleteCourseError.PERMISSION_DENIED,
    });

    expect(await controller.deleteCourse(Root, -1)).toEqual({
      error: DeleteCourseError.NO_SUCH_COURSE,
    });

    expect(await controller.deleteCourse(Root, course.id)).toEqual({});
  });

  it('get course list', async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        controller.createCourse(Root, { ...CourseReq, title: `Course ${i}` }),
      ),
    );

    const req: GetCoursesRequestDto = { take: 10 };

    expect(await controller.getCourses(null, { take: 10 })).toEqual({
      error: GetCoursesError.PERMISSION_DENIED,
    });
    expect(await controller.getCourses(Root, { take: 101 })).toEqual({
      error: GetCoursesError.TAKE_TOO_MANY,
    });

    async function expectRes(
      req: GetCoursesRequestDto,
      len: number,
      cnt: number,
    ) {
      const { courses, count } = await controller.getCourses(Root, req);
      expect(courses.length).toEqual(len);
      expect(count).toEqual(cnt);
    }

    await expectRes(req, 10, 10);
    // take & skip
    await expectRes({ take: 5 }, 5, 10);
    await expectRes({ take: 10, skip: 5 }, 5, 10);
    // filter by ownerId
    await expectRes({ ...req, ownerId: Root.id }, 10, 10);
    await expectRes({ ...req, ownerId: User.id }, 0, 0);
    // search in title
    await expectRes({ ...req, keyword: 'Course' }, 10, 10);
    await expectRes({ ...req, keyword: 'Course 1' }, 1, 1);
    await expectRes(
      { ...req, keyword: 'Course', wildcard: WildcardType.END },
      10,
      10,
    );
    await expectRes(
      { ...req, keyword: 'Course', wildcard: WildcardType.BEGIN },
      0,
      0,
    );
    await expectRes(
      { ...req, keyword: 'Course', wildcard: WildcardType.BOTH },
      10,
      10,
    );
    await expectRes(
      { ...req, keyword: 'Course', wildcard: WildcardType.NONE },
      0,
      0,
    );
  });

  it('create section', async () => {
    expect(await controller.createCourseSection(null, SectionReq)).toEqual({
      error: CreateCourseSectionError.PERMISSION_DENIED,
    });
    expect(await controller.createCourseSection(User, SectionReq)).toEqual({
      error: CreateCourseSectionError.PERMISSION_DENIED,
    });

    expect(
      await controller.createCourseSection(Root, { ...SectionReq, fileId: -1 }),
    ).toEqual({ error: CreateCourseSectionError.NO_SUCH_FILE });

    const { section } = await controller.createCourseSection(Root, SectionReq);
    expect(section).toBeDefined();
  });

  it('get section', async () => {
    const { section } = await controller.createCourseSection(Root, SectionReq);

    expect(await controller.getCourseSection(null, section.id)).toEqual({
      error: GetCourseSectionError.PERMISSION_DENIED,
    });
    expect(await controller.getCourseSection(User, section.id)).toEqual({
      error: GetCourseSectionError.PERMISSION_DENIED,
    });

    expect(await controller.getCourseSection(Admin, section.id)).toEqual({
      section,
    });
  });

  it('update section', async () => {
    const { section } = await controller.createCourseSection(Root, SectionReq);

    expect(
      await controller.updateCourseSection(null, section.id, SectionReq),
    ).toEqual({
      error: UpdateCourseSectionError.PERMISSION_DENIED,
    });
    expect(
      await controller.updateCourseSection(User, section.id, SectionReq),
    ).toEqual({
      error: UpdateCourseSectionError.PERMISSION_DENIED,
    });

    expect(
      await controller.updateCourseSection(Root, section.id, {
        ...SectionReq,
        fileId: -1,
      }),
    ).toEqual({ error: UpdateCourseSectionError.NO_SUCH_FILE });

    expect(
      await controller.updateCourseSection(Admin, section.id, SectionReq),
    ).toEqual({ section });
  });

  it('delete section', async () => {
    const { section } = await controller.createCourseSection(Root, SectionReq);

    expect(await controller.deleteCourseSection(null, section.id)).toEqual({
      error: DeleteCourseSectionError.PERMISSION_DENIED,
    });
    expect(await controller.deleteCourseSection(User, section.id)).toEqual({
      error: DeleteCourseSectionError.PERMISSION_DENIED,
    });

    expect(await controller.deleteCourseSection(Admin, section.id)).toEqual({});
  });

  it('get section list', async () => {
    await controller.createCourseSection(Root, SectionReq);

    const req: GetCourseSectionsRequestDto = { take: 10 };

    expect(await controller.getCourseSections(null, req)).toEqual({
      error: DefaultPaginateError.PERMISSION_DENIED,
    });
    expect(await controller.getCourseSections(User, req)).toEqual({
      error: DefaultPaginateError.PERMISSION_DENIED,
    });
    expect(await controller.getCourseSections(Root, { take: 101 })).toEqual({
      error: DefaultPaginateError.TAKE_TOO_MANY,
    });

    async function expectRes(
      req: GetCourseSectionsRequestDto,
      len: number,
      cnt: number,
    ) {
      const { sections, count } = await controller.getCourseSections(
        Admin,
        req,
      );
      expect(sections.length).toEqual(len);
      expect(count).toEqual(cnt);
    }

    await expectRes(req, 1, 1);
    // take & skip
    await expectRes({ take: 1 }, 1, 1);
    await expectRes({ take: 2, skip: 1 }, 0, 1);
    // filter by type
    await expectRes({ ...req, type: CourseSectionType.VIDEO }, 1, 1);
    await expectRes({ ...req, type: CourseSectionType.SLIDES }, 0, 0);
    // search in title (title = 'Test Section')
    await expectRes({ ...req, keyword: 'Section' }, 1, 1);
    await expectRes({ ...req, keyword: 'Section 1' }, 0, 0);
    await expectRes(
      { ...req, keyword: 'Section', wildcard: WildcardType.BEGIN },
      1,
      1,
    );
    await expectRes(
      { ...req, keyword: 'Section', wildcard: WildcardType.END },
      0,
      0,
    );
    await expectRes(
      { ...req, keyword: 'Section', wildcard: WildcardType.BOTH },
      1,
      1,
    );
    await expectRes(
      { ...req, keyword: 'Section', wildcard: WildcardType.NONE },
      0,
      0,
    );
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await connection.close();
  });
});
