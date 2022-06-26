import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './task.entity';
import { Connection } from 'typeorm';
import { TraineeGetTaskError, TraineeSubmitTaskError } from './dto';
import { TrainingDto, TrainingTaskDto } from '../common/dto';

describe('TaskService', () => {
  let service: TaskService;
  let connection: Connection;
  let tasks: TaskEntity[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        TypeOrmModule.forFeature([TaskEntity]),
      ],
      providers: [TaskService],
    }).compile();

    service = module.get<TaskService>(TaskService);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(TaskEntity).delete({});
  });

  beforeEach(async () => {
    const taskRepo = await connection.getRepository(TaskEntity);
    tasks = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        taskRepo.save({
          id: i + 1,
          title: `Task ${i + 1}`,
          description: `Description ${i + 1}`,
          tags: [`Tag ${i + 1}`],
        }),
      ),
    );
  });

  it('check existence by ids', async () => {
    // SUCCESS
    expect(
      await service.checkExistenceByIds(tasks.map((task) => task.id)),
    ).toBe(true);
    expect(await service.checkExistenceByIds([])).toBe(true);
    expect(await service.checkExistenceByIds([tasks[0].id])).toBe(true);

    // FAILURE
    expect(
      await service.checkExistenceByIds(
        tasks.map((task) => task.id).concat([tasks[0].id - 1]),
      ),
    ).toBe(false);
    expect(await service.checkExistenceByIds([-1])).toBe(false);
  });

  it('to TemplateTaskResponseDto', async () => {
    const res = await service.toTemplateTaskResponseDto(
      tasks.map((task) => ({
        id: task.id,
        tags: [`New Tag ${task.id}`],
        day: task.id,
      })),
    );
    expect(res).toEqual(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        tags: [`New Tag ${task.id}`],
        day: task.id,
      })),
    );
  });

  function generateTraining(): TrainingDto {
    const trainingTasks: TrainingTaskDto[] = [
      { id: tasks[0].id, day: 1, tags: ['Custom Tag 1'], finished: false },
      { id: tasks[1].id, day: 2, tags: ['Custom Tag 2'], finished: true },
      { id: -1, day: 3, tags: ['Custom Tag 3'], finished: false },
    ];
    return { exams: [], courses: [], tasks: trainingTasks };
  }

  it('get from training', async () => {
    const training = generateTraining();

    expect(await service.getFromTraining(training, -1)).toEqual({
      error: TraineeGetTaskError.NO_SUCH_TASK,
    });
    expect(await service.getFromTraining(training, 2)).toEqual({
      error: TraineeGetTaskError.NO_SUCH_TASK,
    });

    expect(await service.getFromTraining(training, 0)).toEqual({
      task: {
        title: tasks[0].title,
        description: tasks[0].description,
        tags: ['Custom Tag 1'],
        day: 1,
        finished: false,
      },
    });
  });

  it('submit to training', async () => {
    const training = generateTraining();

    expect(await service.submitToTraining(training, -1)).toEqual({
      error: TraineeSubmitTaskError.NO_SUCH_TASK,
    });
    expect(await service.submitToTraining(training, 2)).toEqual({
      error: TraineeSubmitTaskError.NO_SUCH_TASK,
    });

    const testFn = jest.fn();

    expect(await service.submitToTraining(training, 1, testFn)).toEqual({});
    expect(testFn).toBeCalled();
  });

  afterEach(async () => {
    await connection.getRepository(TaskEntity).delete({});
  });

  afterAll(async () => {
    await connection.close();
  });
});
