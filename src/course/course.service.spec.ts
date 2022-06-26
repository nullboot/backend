import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { Connection } from 'typeorm';
import { ConfigModule } from '../config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './course.entity';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { CourseSectionService } from './course-section.service';
import { CourseSectionEntity } from './course-section.entity';
import { FileModule } from '../file/file.module';
import { UserEntity } from '../user/user.entity';

describe('CourseService', () => {
  let service: CourseService;
  let connection: Connection;
  let Courses: CourseEntity[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        TypeOrmModule.forFeature([CourseEntity, CourseSectionEntity]),
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        forwardRef(() => FileModule),
      ],
      providers: [CourseService, CourseSectionService],
    }).compile();

    service = module.get<CourseService>(CourseService);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(CourseEntity).delete({});
    await connection.getRepository(CourseSectionEntity).delete({});
    const userRepo = connection.getRepository(UserEntity);
    await userRepo.delete({});
    const Root = await userRepo.save({
      username: 'root',
      realname: 'root',
      email: 'root@null.boot',
      roles: [],
      publicEmail: true,
      isRoot: true,
    });
    Courses = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        connection.getRepository(CourseEntity).save({
          title: `course ${i}`,
          description: `description ${i}`,
          sectionIds: [],
          tags: [],
          owner: Root,
        }),
      ),
    );
  });

  it('find by ids', async () => {
    const result = await service.findByIds(Courses.map((c) => c.id));

    Courses.forEach((c) => expect(result.get(c.id)).toBeDefined());

    expect(await service.findByIds([])).toEqual(new Map());
  });

  it('check existence by ids', async () => {
    expect(await service.checkExistenceByIds(Courses.map((c) => c.id))).toBe(
      true,
    );
    expect(await service.checkExistenceByIds([])).toBe(true);
    expect(await service.checkExistenceByIds([Courses[0].id])).toBe(true);

    expect(await service.checkExistenceByIds([-1])).toBe(false);
  });

  it('get section count by ids', async () => {
    expect(
      await service.getSectionCountByIds(Courses.map((c) => c.id)),
    ).toEqual(Courses.map(() => 0));
  });

  afterAll(async () => {
    await connection.getRepository(CourseEntity).delete({});
    await connection.getRepository(CourseSectionEntity).delete({});
    await connection.getRepository(UserEntity).delete({});
    await connection.close();
  });
});
