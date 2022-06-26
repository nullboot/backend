import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { Connection } from 'typeorm';
import { TemplateService } from './template.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity, TemplateType } from './template.entity';
import { forwardRef } from '@nestjs/common';
import { ExamModule } from '../exam/exam.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../database/database.module';
import { TaskModule } from '../task/task.module';
import { PermissionModule } from '../permission/permission.module';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import {
  GetTemplateError,
  GetTemplatesError,
  GetTemplatesRequestDto,
  GetTemplatesResponseDto,
  TemplateBriefResponseDto,
  TemplateRequestDto,
  TemplateResponseDto,
  UpdateTemplateError,
} from './dto';
import { Role } from '../common/role';
import { DivisionService } from '../tag/tag-division.service';
import { PermissionService } from '../permission/permission.service';
import { DivisionEntity } from '../tag/tag-division.entity';
import { DivisionDto } from '../tag/dto';
import { CourseModule } from '../course/course.module';
import { FileModule } from '../file/file.module';

describe('TemplateController', () => {
  let controller: TemplateController;
  let divisionService: DivisionService;
  let permissionService: PermissionService;
  let connection: Connection;
  let userService: UserService;
  let Root: UserEntity;
  let Alice: UserEntity;
  let Admin: UserEntity;
  let TemplateReq: TemplateRequestDto;
  let divisions: DivisionEntity[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([TemplateEntity]),
        forwardRef(() => DatabaseModule),
        forwardRef(() => ExamModule),
        forwardRef(() => TaskModule),
        forwardRef(() => CourseModule),
        forwardRef(() => FileModule),
        forwardRef(() => TagModule),
        forwardRef(() => UserModule),
        forwardRef(() => PermissionModule),
      ],
      controllers: [TemplateController],
      providers: [TemplateService],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
    connection = module.get<Connection>(Connection);
    divisionService = module.get<DivisionService>(DivisionService);
    permissionService = module.get<PermissionService>(PermissionService);
    userService = module.get<UserService>(UserService);
    await connection.getRepository('user').delete({});
    await connection.getRepository('tag_division').delete({});
  });

  function createUser(username: string) {
    return {
      username,
      email: `${username}@null.boot`,
      realname: username,
      roles: [],
      isRoot: false,
    };
  }

  beforeEach(async () => {
    const userRepo = connection.getRepository<UserEntity>('user');
    Alice = await userRepo.save(createUser('Alice'));
    Admin = await userRepo.save({
      ...createUser('Admin'),
      roles: [Role.ADMIN],
    });
    Root = await userRepo.save({
      ...createUser('Root'),
      isRoot: true,
    });
    TemplateReq = {
      exams: [],
      tasks: [],
      courses: [],
    };

    divisions = (
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          divisionService.create(`Division ${i}`),
        ),
      )
    )
      .map(([_, division]) => division)
      .sort((a, b) => a.id - b.id);
    await permissionService.setPermissions(Admin, Role.ADMIN, [
      divisions[0].id,
      divisions[1].id,
    ]);
    await permissionService.setPermissions(Admin, Role.HRBP, [
      divisions[0].id,
      divisions[2].id,
    ]);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  function expectError(value: any, error: any) {
    expect(value).toEqual({ error });
  }

  function resToBrief(res: TemplateResponseDto): TemplateBriefResponseDto {
    return {
      type: res.type,
      division: res.division,
      examCount: res.exams.length,
      taskCount: res.tasks.length,
      courseCount: res.courses.length,
    };
  }

  function emptyDto(
    type: TemplateType,
    division: DivisionDto,
  ): TemplateResponseDto {
    return {
      exams: [],
      tasks: [],
      courses: [],
      type,
      division: DivisionService.toDto(division),
    };
  }

  it('get template', async () => {
    // PERMISSION_DENIED
    expectError(
      await controller.getTemplate(null, TemplateType.NEWBIE, divisions[0].id),
      GetTemplateError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getTemplate(Alice, TemplateType.NEWBIE, divisions[0].id),
      GetTemplateError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getTemplate(Admin, TemplateType.NEWBIE, divisions[2].id),
      GetTemplateError.PERMISSION_DENIED,
    );

    // NO_SUCH_TEMPLATE
    expectError(
      await controller.getTemplate(Root, TemplateType.NEWBIE, -1),
      GetTemplateError.NO_SUCH_TEMPLATE,
    );
    expectError(
      await controller.getTemplate(Root, 'ADMIN' as any, divisions[0].id),
      GetTemplateError.NO_SUCH_TEMPLATE,
    );

    // SUCCESS
    expect(
      await controller.getTemplate(Root, TemplateType.NEWBIE, divisions[3].id),
    ).toEqual({ template: emptyDto(TemplateType.NEWBIE, divisions[3]) });
    expect(
      await controller.getTemplate(Admin, TemplateType.NEWBIE, divisions[1].id),
    ).toEqual({ template: emptyDto(TemplateType.NEWBIE, divisions[1]) });
    expect(
      await controller.getTemplate(Admin, TemplateType.TUTOR, divisions[0].id),
    ).toEqual({ template: emptyDto(TemplateType.TUTOR, divisions[0]) });
  });

  it('update template', async () => {
    // PERMISSION_DENIED
    expectError(
      await controller.updateTemplate(
        null,
        TemplateType.NEWBIE,
        divisions[0].id,
        TemplateReq,
      ),
      UpdateTemplateError.PERMISSION_DENIED,
    );
    expectError(
      await controller.updateTemplate(
        Alice,
        TemplateType.NEWBIE,
        divisions[0].id,
        TemplateReq,
      ),
      UpdateTemplateError.PERMISSION_DENIED,
    );
    expectError(
      await controller.updateTemplate(
        Admin,
        TemplateType.NEWBIE,
        divisions[2].id,
        TemplateReq,
      ),
      UpdateTemplateError.PERMISSION_DENIED,
    );

    // INVALID_TASK
    expectError(
      await controller.updateTemplate(
        Root,
        TemplateType.NEWBIE,
        divisions[0].id,
        {
          ...TemplateReq,
          tasks: [
            {
              id: -1,
              day: 0,
              tags: [],
            },
          ],
        },
      ),
      UpdateTemplateError.INVALID_TASK,
    );

    // INVALID_EXAM
    expectError(
      await controller.updateTemplate(
        Root,
        TemplateType.NEWBIE,
        divisions[0].id,
        {
          ...TemplateReq,
          exams: [
            {
              id: -1,
              day: 0,
              tags: [],
            },
          ],
        },
      ),
      UpdateTemplateError.INVALID_EXAM,
    );

    // INVALID_COURSE
    // expectError(
    //   await controller.updateTemplate(Root, TemplateType.NEWBIE, divisions[0].id, {
    //     ...TemplateReq,
    //     courses: [
    //       {
    //         id: -1,
    //         day: 0,
    //         tags: [],
    //         isOptional: false,
    //       },
    //     ],
    //   }),
    //   UpdateTemplateError.INVALID_COURSE,
    // );

    // NO_SUCH_TEMPLATE
    expectError(
      await controller.updateTemplate(
        Root,
        TemplateType.NEWBIE,
        -1,
        TemplateReq,
      ),
      UpdateTemplateError.NO_SUCH_TEMPLATE,
    );
    expectError(
      await controller.updateTemplate(
        Root,
        'ADMIN' as any,
        divisions[0].id,
        TemplateReq,
      ),
      UpdateTemplateError.NO_SUCH_TEMPLATE,
    );

    // SUCCESS
    expect(
      await controller.updateTemplate(
        Root,
        TemplateType.NEWBIE,
        divisions[4].id,
        TemplateReq,
      ),
    ).toEqual({ template: emptyDto(TemplateType.NEWBIE, divisions[4]) });
    expect(
      await controller.updateTemplate(
        Admin,
        TemplateType.TUTOR,
        divisions[1].id,
        TemplateReq,
      ),
    ).toEqual({ template: emptyDto(TemplateType.TUTOR, divisions[1]) });
    expect(
      await controller.updateTemplate(
        Admin,
        TemplateType.NEWBIE,
        divisions[0].id,
        TemplateReq,
      ),
    ).toEqual({ template: emptyDto(TemplateType.NEWBIE, divisions[0]) });
  });

  it('get template list', async () => {
    const req: GetTemplatesRequestDto = { take: 10 };

    // PERMISSION_DENIED
    expectError(
      await controller.getTemplates(null, TemplateType.NEWBIE, req),
      GetTemplatesError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getTemplates(Alice, TemplateType.NEWBIE, req),
      GetTemplatesError.PERMISSION_DENIED,
    );

    // TAKE_TOO_MANY
    expectError(
      await controller.getTemplates(Root, TemplateType.NEWBIE, { take: 1001 }),
      GetTemplatesError.TAKE_TOO_MANY,
    );

    // SUCCESS
    function expectList(
      { templates, count }: GetTemplatesResponseDto,
      expectedTemplates: TemplateBriefResponseDto[],
      expectedCount: number,
    ) {
      expect(templates).toEqual(expectedTemplates);
      expect(count).toEqual(expectedCount);
    }

    expectList(
      await controller.getTemplates(Root, TemplateType.NEWBIE, req),
      divisions
        .map((division) => emptyDto(TemplateType.NEWBIE, division))
        .map(resToBrief),
      divisions.length,
    );
    expectList(
      await controller.getTemplates(Admin, TemplateType.TUTOR, req),
      [divisions[0], divisions[1]]
        .map((division) => emptyDto(TemplateType.TUTOR, division))
        .map(resToBrief),
      2,
    );

    // SUCCESS_WITH_FILTER
    // skip
    expectList(
      await controller.getTemplates(Root, TemplateType.NEWBIE, {
        take: 10,
        skip: 1,
      }),
      divisions
        .filter((_, index) => index != 0)
        .map((division) => emptyDto(TemplateType.NEWBIE, division))
        .map(resToBrief),
      divisions.length,
    );
  });

  afterEach(async () => {
    await connection.getRepository('user').delete({});
    await connection.getRepository('tag_division').delete({});
  });
  afterAll(async () => {
    await connection.close();
  });
});
