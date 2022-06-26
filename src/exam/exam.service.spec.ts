import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from './exam.service';
import { Connection } from 'typeorm';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamEntity, toExamContent } from './exam.entity';
import {
  ExamAnswersRequestDto,
  ExamProblemType,
  ProblemDto,
  TraineeGetExamError,
  TraineeSubmitExamError,
} from './dto';
import { TrainingDto, TrainingExamDto } from '../common/dto';

describe('ExamService', () => {
  let service: ExamService;
  let connection: Connection;
  let problems: ProblemDto[];
  let exams: ExamEntity[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        TypeOrmModule.forFeature([ExamEntity]),
      ],
      providers: [ExamService],
    }).compile();

    service = module.get<ExamService>(ExamService);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(ExamEntity).delete({});
  });

  beforeEach(async () => {
    const examRepo = await connection.getRepository(ExamEntity);
    problems = [
      {
        title: 'Problem 1',
        options: ['A', 'B', 'C', 'D'],
        type: ExamProblemType.SINGLE_CHOICE,
        answers: [0],
        reason: "I don't know why",
      },
      {
        title: 'Problem 2',
        options: ['A', 'B', 'C', 'D'],
        type: ExamProblemType.MULTIPLE_CHOICE,
        answers: [0, 1],
        reason: "I don't know why",
      },
    ];
    exams = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        examRepo.save({
          id: i + 1,
          title: `Exam ${i + 1}`,
          description: `Description ${i + 1}`,
          tags: [`tag ${i + 1}`, `tag ${i + 2}`],
          content: toExamContent(problems),
        }),
      ),
    );
  });

  it('check existence by ids', async () => {
    // SUCCESS
    expect(
      await service.checkExistenceByIds(exams.map((exam) => exam.id)),
    ).toBe(true);
    expect(await service.checkExistenceByIds([])).toBe(true);
    expect(await service.checkExistenceByIds([exams[0].id])).toBe(true);

    // FAILURE
    expect(
      await service.checkExistenceByIds(
        exams.map((exam) => exam.id).concat([exams[0].id - 1]),
      ),
    ).toBe(false);
    expect(await service.checkExistenceByIds([-1])).toBe(false);
  });

  it('to TemplateExamResponseDto', async () => {
    const res = await service.toTemplateExamResponseDto(
      exams.map((exam) => ({
        id: exam.id,
        tags: [`New Tag ${exam.id}`],
        day: exam.id,
      })),
    );
    expect(res).toEqual(
      exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        tags: [`New Tag ${exam.id}`],
        day: exam.id,
      })),
    );
  });

  it('submit answers', async () => {
    const answers: ExamAnswersRequestDto[] = problems.map((problem) => ({
      answers: problem.answers,
    }));

    // SUCCESS
    expect(ExamService.validateSubmitAnswers(problems, answers)).toBe(true);
    expect(
      ExamService.validateSubmitAnswers(problems, [
        { answers: [] },
        { answers: [] },
      ]),
    ).toBe(true);
    expect(ExamService.judge(exams[0], answers)).toEqual([
      problems.map((problem) => ({
        answers: problem.answers,
        reason: problem.reason,
        isCorrect: true,
      })),
      2,
    ]);
    expect(
      ExamService.judge(exams[0], [{ answers: [1] }, { answers: [1, 2] }]),
    ).toEqual([
      problems.map((problem) => ({
        answers: problem.answers,
        reason: problem.reason,
        isCorrect: false,
      })),
      0,
    ]);
    expect(
      ExamService.judge(exams[0], [{ answers: [] }, { answers: [] }]),
    ).toEqual([
      problems.map((problem) => ({
        answers: problem.answers,
        reason: problem.reason,
        isCorrect: false,
      })),
      0,
    ]);

    // FAILURE
    // wrong length
    expect(ExamService.validateSubmitAnswers(problems, [])).toBe(false);
    expect(
      ExamService.validateSubmitAnswers(problems, [{ answers: [1] }]),
    ).toBe(false);
    expect(
      ExamService.validateSubmitAnswers(problems, [
        { answers: [0] },
        { answers: [0] },
        { answers: [0] },
      ]),
    ).toBe(false);
    // invalid single choice
    expect(
      ExamService.validateSubmitAnswers(problems, [
        { answers: [-1] },
        { answers: [0, 1] },
      ]),
    ).toBe(false);
    expect(
      ExamService.validateSubmitAnswers(problems, [
        { answers: [1, 2] },
        { answers: [0, 1] },
      ]),
    ).toBe(false);
    // invalid multiple choice
    expect(
      ExamService.validateSubmitAnswers(problems, [
        { answers: [0] },
        { answers: [-1] },
      ]),
    ).toBe(false);
    expect(
      ExamService.validateSubmitAnswers(problems, [
        { answers: [0] },
        { answers: [100] },
      ]),
    ).toBe(false);
  });

  function generateTraining(): TrainingDto {
    const trainingExams: TrainingExamDto[] = [
      {
        id: exams[0].id,
        day: 1,
        tags: ['Custom Tag 1'],
        finished: false,
        score: 0,
      },
      {
        id: exams[1].id,
        day: 2,
        tags: ['Custom Tag 2'],
        finished: true,
        score: 0,
      },
      { id: -1, day: 3, tags: ['Custom Tag 3'], finished: false, score: 0 },
    ];
    return { exams: trainingExams, courses: [], tasks: [] };
  }

  it('get from training', async () => {
    const training = generateTraining();

    expect(await service.getFromTraining(training, -1)).toEqual({
      error: TraineeGetExamError.NO_SUCH_EXAM,
    });
    expect(await service.getFromTraining(training, 2)).toEqual({
      error: TraineeGetExamError.NO_SUCH_EXAM,
    });

    expect(await service.getFromTraining(training, 0)).toEqual({
      exam: {
        title: exams[0].title,
        description: exams[0].description,
        tags: ['Custom Tag 1'],
        day: 1,
        finished: false,
        problems: problems.map((problem) => ({
          title: problem.title,
          options: problem.options,
          type: problem.type,
        })),
      },
    });
  });

  it('submit to training', async () => {
    const training = generateTraining();

    const ans: ExamAnswersRequestDto[] = problems.map(({ answers }) => ({
      answers,
    }));

    expect(await service.submitToTraining(training, -1, ans)).toEqual({
      error: TraineeSubmitExamError.NO_SUCH_EXAM,
    });
    expect(await service.submitToTraining(training, 2, ans)).toEqual({
      error: TraineeSubmitExamError.NO_SUCH_EXAM,
    });

    expect(await service.submitToTraining(training, 0, [ans[0]])).toEqual({
      error: TraineeSubmitExamError.INVALID_ANSWER_COUNT,
    });
    expect(
      await service.submitToTraining(training, 0, [{ answers: [-1] }, ans[1]]),
    ).toEqual({ error: TraineeSubmitExamError.INVALID_ANSWER });

    const testFn = jest.fn();

    // wrong answers
    expect(
      await service.submitToTraining(
        training,
        1,
        [{ answers: [1] }, ans[1]],
        testFn,
      ),
    ).toEqual({ results: expect.anything(), passed: false });
    expect(testFn).not.toBeCalled();

    // pass~
    expect(await service.submitToTraining(training, 1, ans, testFn)).toEqual({
      results: expect.anything(),
      passed: true,
    });
    expect(testFn).toBeCalled();
  });

  afterEach(async () => {
    await connection.getRepository(ExamEntity).delete({});
  });

  afterAll(async () => {
    await connection.close();
  });
});
