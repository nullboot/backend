import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskEntity } from './task.entity';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import {
  CreateTaskError,
  DeleteTaskError,
  GetTaskError,
  GetTasksError,
  GetTasksRequestDto,
  GetTasksResponseDto,
  TaskDto,
  TaskRequestDto,
  UpdateTaskError,
} from './dto';
import { WildcardType } from '../common/dto';

describe('TaskController', () => {
  let controller: TaskController;
  let connection: Connection;
  let Root: UserEntity;
  let Admin: UserEntity;
  let User: UserEntity;
  let TaskReq: TaskRequestDto;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        TypeOrmModule.forFeature([TaskEntity]),
      ],
      controllers: [TaskController],
      providers: [TaskService],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(TaskEntity).delete({});
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
    TaskReq = {
      title: 'Test Task',
      description: 'Test Task Description',
      tags: ['test', 'task'],
    };
  });

  function expectError(value: any, error: any) {
    expect(value).toEqual({ error });
  }

  function dtoToReq(dto: TaskDto): TaskRequestDto {
    return {
      title: dto.title,
      description: dto.description,
      tags: dto.tags,
    };
  }

  it('create task', async () => {
    // PERMISSION_DENIED
    expectError(
      await controller.createTask(null, TaskReq),
      CreateTaskError.PERMISSION_DENIED,
    );
    expectError(
      await controller.createTask(User, TaskReq),
      CreateTaskError.PERMISSION_DENIED,
    );

    // SUCCESS
    const { task } = await controller.createTask(Root, TaskReq);
    expect(dtoToReq(task)).toEqual(TaskReq);
  });

  it('get task', async () => {
    const { task } = await controller.createTask(Root, TaskReq);

    // PERMISSION_DENIED
    expectError(
      await controller.getTask(null, task.id),
      GetTaskError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getTask(User, task.id),
      GetTaskError.PERMISSION_DENIED,
    );

    // NO_SUCH_TASK
    expectError(await controller.getTask(Root, -1), GetTaskError.NO_SUCH_TASK);

    // SUCCESS
    expect((await controller.getTask(Root, task.id)).task).toEqual(task);
  });

  it('update task', async () => {
    const { task } = await controller.createTask(Root, TaskReq);
    TaskReq.title = 'Updated Task';

    // PERMISSION_DENIED
    expectError(
      await controller.updateTask(null, task.id, TaskReq),
      UpdateTaskError.PERMISSION_DENIED,
    );
    expectError(
      await controller.updateTask(User, task.id, TaskReq),
      UpdateTaskError.PERMISSION_DENIED,
    );
    expectError(
      await controller.updateTask(Admin, task.id, TaskReq),
      UpdateTaskError.PERMISSION_DENIED,
    );

    // NO_SUCH_TASK
    expectError(
      await controller.updateTask(Root, -1, TaskReq),
      UpdateTaskError.NO_SUCH_TASK,
    );

    // SUCCESS
    const ret = await controller.updateTask(Root, task.id, TaskReq);
    expect(dtoToReq(ret.task)).toEqual(TaskReq);
  });

  it('delete task', async () => {
    const { task } = await controller.createTask(Root, TaskReq);

    // PERMISSION_DENIED
    expectError(
      await controller.deleteTask(null, task.id),
      DeleteTaskError.PERMISSION_DENIED,
    );
    expectError(
      await controller.deleteTask(User, task.id),
      DeleteTaskError.PERMISSION_DENIED,
    );
    expectError(
      await controller.deleteTask(Admin, task.id),
      DeleteTaskError.PERMISSION_DENIED,
    );

    // NO_SUCH_TASK
    expectError(
      await controller.deleteTask(Root, -1),
      DeleteTaskError.NO_SUCH_TASK,
    );

    // SUCCESS
    expect(await controller.deleteTask(Root, task.id)).toEqual({});
  });

  it('get task list', async () => {
    const { task } = await controller.createTask(Root, TaskReq);
    const req: GetTasksRequestDto = { take: 10 };

    // PERMISSION_DENIED
    expectError(
      await controller.getTasks(null, req),
      GetTasksError.PERMISSION_DENIED,
    );
    expectError(
      await controller.getTasks(User, req),
      GetTasksError.PERMISSION_DENIED,
    );

    // TAKE_TOO_MANY
    expectError(
      await controller.getTasks(Root, { take: 1001 }),
      GetTasksError.TAKE_TOO_MANY,
    );

    // SUCCESS
    expect(await controller.getTasks(Root, req)).toEqual<GetTasksResponseDto>({
      tasks: [task],
      count: 1,
    });
    expect(await controller.getTasks(Admin, req)).toEqual<GetTasksResponseDto>({
      tasks: [task],
      count: 1,
    });

    // SUCCESS_WITH_FILTER
    // skip
    expect(
      await controller.getTasks(Root, { ...req, skip: 1 }),
    ).toEqual<GetTasksResponseDto>({ tasks: [], count: 1 });
    // owner
    expect(
      await controller.getTasks(Root, { ...req, ownerId: Root.id }),
    ).toEqual<GetTasksResponseDto>({ tasks: [task], count: 1 });
    expect(
      await controller.getTasks(Root, { ...req, ownerId: Admin.id }),
    ).toEqual<GetTasksResponseDto>({ tasks: [], count: 0 });
    // search in title
    expect(
      await controller.getTasks(Root, { ...req, keyword: 'Test Task' }),
    ).toEqual<GetTasksResponseDto>({ tasks: [task], count: 1 });
    expect(
      await controller.getTasks(Root, {
        ...req,
        keyword: 'Task',
        wildcard: WildcardType.BEGIN,
      }),
    ).toEqual<GetTasksResponseDto>({ tasks: [task], count: 1 });
    expect(
      await controller.getTasks(Root, {
        ...req,
        keyword: 'Task',
        wildcard: WildcardType.NONE,
      }),
    ).toEqual<GetTasksResponseDto>({ tasks: [], count: 0 });
    expect(
      await controller.getTasks(Root, {
        ...req,
        keyword: 'Task',
        wildcard: WildcardType.END,
      }),
    ).toEqual<GetTasksResponseDto>({ tasks: [], count: 0 });
  });

  afterEach(async () => {
    await connection.getRepository(TaskEntity).delete({});
    await connection.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await connection.close();
  });
});
