import { Test, TestingModule } from '@nestjs/testing';
import { ExamController } from './exam.controller';
import { Connection } from 'typeorm';
import { forwardRef, HttpStatus } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamEntity } from './exam.entity';
import { ExamService } from './exam.service';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import {
  CreateExamError,
  DeleteExamError,
  ExamDto,
  ExamProblemType,
  ExamRequestDto,
  GetExamError,
  GetExamsError,
  GetExamsRequestDto,
  GetExamsResponseDto,
  ParseExamCsvFileError,
  UpdateExamError,
} from './dto';
import { Errback, Response } from 'express';
import { WildcardType } from '../common/dto';

describe('ExamController', () => {
  let controller: ExamController;
  let connection: Connection;
  let Root: UserEntity;
  let Admin: UserEntity;
  let User: UserEntity;
  let ExamReq: ExamRequestDto;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        TypeOrmModule.forFeature([ExamEntity]),
      ],
      controllers: [ExamController],
      providers: [ExamService],
    }).compile();

    controller = module.get<ExamController>(ExamController);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(ExamEntity).delete({});
    await connection.getRepository(UserEntity).delete({});
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
    const userRepo = connection.getRepository(UserEntity);
    User = await userRepo.save(createUser('User'));
    Root = await userRepo.save({ ...createUser('Root'), isRoot: true });
    Admin = await userRepo.save({
      ...createUser('Admin'),
      roles: [Role.ADMIN],
    });
    ExamReq = {
      title: 'Test Exam',
      description: 'Test Exam Description',
      tags: ['test', 'exam'],
      problems: [
        {
          title: 'Test Problem',
          options: ['A', 'B', 'C', 'D'],
          type: ExamProblemType.SINGLE_CHOICE,
          answers: [0],
          reason: 'Test Reason',
        },
        {
          title: 'Test Problem 2',
          options: ['A', 'B', 'C', 'D'],
          type: ExamProblemType.MULTIPLE_CHOICE,
          answers: [0, 1],
          reason: 'Test Reason 2',
        },
      ],
    };
  });

  function expectError(value: any, error: any) {
    expect(value).toEqual({ error });
  }

  function dtoToReq(dto: ExamDto): ExamRequestDto {
    return {
      title: dto.title,
      description: dto.description,
      tags: dto.tags,
      problems: dto.problems,
    };
  }

  it('create exam', async () => {
    // PERMISSION_DENIED
    expectError(
      await controller.createExam(null, ExamReq),
      CreateExamError.PERMISSION_DENIED,
    );
    expectError(
      await controller.createExam(User, ExamReq),
      CreateExamError.PERMISSION_DENIED,
    );

    // INVALID_ANSWER
    expectError(
      await controller.createExam(Root, {
        ...ExamReq,
        problems: [
          {
            ...ExamReq.problems[0],
            answers: [0, 1],
          },
        ],
      }),
      CreateExamError.INVALID_ANSWER,
    );
    expectError(
      await controller.createExam(Root, {
        ...ExamReq,
        problems: [
          {
            ...ExamReq.problems[1],
            answers: [-1],
          },
        ],
      }),
      CreateExamError.INVALID_ANSWER,
    );

    // SUCCESS
    const { exam } = await controller.createExam(Root, ExamReq);
    expect(dtoToReq(exam)).toEqual(ExamReq);
  });

  it('get exam', async () => {
    const { exam } = await controller.createExam(Root, ExamReq);

    // PERMISSION_DENIED
    expectError(
      await controller.getExam(null, exam.id),
      GetExamError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getExam(User, exam.id),
      GetExamError.PERMISSION_DENIED,
    );

    // NO_SUCH_EXAM
    expectError(await controller.getExam(Root, -1), GetExamError.NO_SUCH_EXAM);

    // SUCCESS
    expect(await controller.getExam(Root, exam.id)).toEqual({ exam });
  });

  it('update exam', async () => {
    const { exam } = await controller.createExam(Root, ExamReq);

    // PERMISSION_DENIED
    expectError(
      await controller.updateExam(null, exam.id, ExamReq),
      UpdateExamError.PERMISSION_DENIED,
    );
    expectError(
      await controller.updateExam(User, exam.id, ExamReq),
      UpdateExamError.PERMISSION_DENIED,
    );
    expectError(
      await controller.updateExam(Admin, exam.id, ExamReq),
      UpdateExamError.PERMISSION_DENIED,
    );

    // NO_SUCH_EXAM
    expectError(
      await controller.updateExam(Root, -1, ExamReq),
      UpdateExamError.NO_SUCH_EXAM,
    );

    // INVALID_ANSWER
    expectError(
      await controller.updateExam(Root, exam.id, {
        ...ExamReq,
        problems: [
          {
            ...ExamReq.problems[0],
            answers: [0, 1],
          },
        ],
      }),
      UpdateExamError.INVALID_ANSWER,
    );
    expectError(
      await controller.updateExam(Root, exam.id, {
        ...ExamReq,
        problems: [
          {
            ...ExamReq.problems[1],
            answers: [-1],
          },
        ],
      }),
      UpdateExamError.INVALID_ANSWER,
    );
    expectError(
      await controller.updateExam(Root, exam.id, {
        ...ExamReq,
        problems: [
          {
            ...ExamReq.problems[1],
            type: null,
          },
        ],
      }),
      UpdateExamError.INVALID_ANSWER,
    );

    // SUCCESS
    expect(
      await controller.updateExam(Root, exam.id, {
        ...ExamReq,
        title: 'Test Exam 2',
      }),
    ).toEqual({ exam: { ...exam, title: 'Test Exam 2' } });
  });

  it('delete exam', async () => {
    const { exam } = await controller.createExam(Root, ExamReq);

    // PERMISSION_DENIED
    expectError(
      await controller.deleteExam(null, exam.id),
      DeleteExamError.PERMISSION_DENIED,
    );
    expectError(
      await controller.deleteExam(User, exam.id),
      DeleteExamError.PERMISSION_DENIED,
    );
    expectError(
      await controller.deleteExam(Admin, exam.id),
      DeleteExamError.PERMISSION_DENIED,
    );

    // NO_SUCH_EXAM
    expectError(
      await controller.deleteExam(Root, -1),
      DeleteExamError.NO_SUCH_EXAM,
    );

    // SUCCESS
    expect(await controller.deleteExam(Root, exam.id)).toEqual({});
  });

  it('get exam list', async () => {
    const { exam } = await controller.createExam(Root, ExamReq);
    const req: GetExamsRequestDto = { take: 10 };

    // PERMISSION_DENIED
    expectError(
      await controller.getExams(null, req),
      GetExamsError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getExams(User, req),
      GetExamsError.PERMISSION_DENIED,
    );

    // TAKE_TOO_MANY
    expectError(
      await controller.getExams(Root, { take: 1001 }),
      GetExamsError.TAKE_TOO_MANY,
    );

    // SUCCESS
    expect(await controller.getExams(Root, req)).toEqual({
      exams: [exam],
      count: 1,
    });
    expect(await controller.getExams(Admin, req)).toEqual({
      exams: [exam],
      count: 1,
    });

    // SUCCESS_WITH_FILTER
    // skip
    expect(
      await controller.getExams(Root, { ...req, skip: 1 }),
    ).toEqual<GetExamsResponseDto>({ exams: [], count: 1 });
    // owner
    expect(
      await controller.getExams(Root, { ...req, ownerId: Root.id }),
    ).toEqual<GetExamsResponseDto>({ exams: [exam], count: 1 });
    expect(
      await controller.getExams(Root, { ...req, ownerId: Admin.id }),
    ).toEqual<GetExamsResponseDto>({ exams: [], count: 0 });
    // search in title
    expect(
      await controller.getExams(Root, { ...req, keyword: 'Test exam' }),
    ).toEqual<GetExamsResponseDto>({ exams: [exam], count: 1 });
    expect(
      await controller.getExams(Root, {
        ...req,
        keyword: 'exam',
        wildcard: WildcardType.BEGIN,
      }),
    ).toEqual<GetExamsResponseDto>({ exams: [exam], count: 1 });
    expect(
      await controller.getExams(Root, {
        ...req,
        keyword: 'exam',
        wildcard: WildcardType.NONE,
      }),
    ).toEqual<GetExamsResponseDto>({ exams: [], count: 0 });
    expect(
      await controller.getExams(Root, {
        ...req,
        keyword: 'exam',
        wildcard: WildcardType.END,
      }),
    ).toEqual<GetExamsResponseDto>({ exams: [], count: 0 });
  });

  it('get exam template', async () => {
    let mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      download: jest.fn().mockReturnThis(),
    } as any as Response;

    await controller.getExamTemplate(null, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);

    await controller.getExamTemplate(Root, mockResponse);
    expect(mockResponse.download).toBeCalled();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      download: jest.fn(
        async (path: string, fn?: Errback) => await fn(new Error('test')),
      ),
    } as any;

    await controller.getExamTemplate(Root, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('parse exam template', async () => {
    const file: Express.Multer.File = {
      buffer: Buffer.from('test'),
    } as any;

    expect(await controller.parseExamCsvFile(null, file)).toEqual({
      error: ParseExamCsvFileError.PERMISSION_DENIED,
    });
    expect(await controller.parseExamCsvFile(Root, file)).toEqual({
      error: ParseExamCsvFileError.INVALID_FILE_FORMAT,
    });

    file.buffer = Buffer.from(
      'title,type,answers,reason,option A,option B,option C,option D,option E\n' +
        '1+1=?,single,A,1+1=2,2,3,1,4,10\n' +
        '1+1=?,single_choice,0,1+1=2,2,3,1,4,10\n' +
        '1+2<=?,multiple,"1,3,4",2,3,1,4,10,0',
    );
    expect(await controller.parseExamCsvFile(Root, file)).toEqual({
      problems: expect.any(Array),
    });

    file.buffer = Buffer.from(
      'title,type,answers,reason,option A,option B,option C,option D,option E\n' +
        '1+1=?,single,A,',
    );
    expect(await controller.parseExamCsvFile(Root, file)).toEqual({
      error: ParseExamCsvFileError.INVALID_FILE_FORMAT,
    });

    file.buffer = Buffer.from(
      'title,type,answers,reason,option A,option B,option C,option D,option E\n' +
        '1+1=?,invalid,A,1+1=2,2,3,1,4,10',
    );
    expect(await controller.parseExamCsvFile(Root, file)).toEqual({
      error: ParseExamCsvFileError.INVALID_FILE_FORMAT,
    });
  });

  afterEach(async () => {
    await connection.getRepository(ExamEntity).delete({});
    await connection.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await connection.close();
  });
});
