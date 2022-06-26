import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { TaskEntity } from './task.entity';
import { UserEntity } from '../user/user.entity';
import {
  CreateTaskRequestDto,
  TaskDto,
  TaskForTraineeDto,
  TraineeGetTaskError,
  TraineeGetTaskResponseDto,
  TraineeSubmitTaskError,
  TraineeSubmitTaskResponseDto,
  UpdateTaskRequestDto,
} from './dto';
import {
  TemplateTaskRequestDto,
  TemplateTaskResponseDto,
} from '../template/dto';
import { TrainingDto, TrainingTaskDto, WildcardType } from '../common/dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async findById(id: number, loadOwner = false): Promise<TaskEntity> {
    const query = this.taskRepository.createQueryBuilder('task');
    if (loadOwner) query.leftJoinAndSelect('task.owner', 'owner');
    query.where('task.id = :taskId', { taskId: id });
    return await query.getOne();
  }

  async update(
    task: TaskEntity,
    body: UpdateTaskRequestDto,
  ): Promise<TaskEntity> {
    task.title = body.title;
    task.description = body.description;
    task.tags = body.tags;
    return await this.taskRepository.save(task);
  }

  async create(
    body: CreateTaskRequestDto,
    owner: UserEntity,
  ): Promise<TaskEntity> {
    return await this.taskRepository.save({
      title: body.title,
      description: body.description,
      tags: body.tags,
      owner,
    });
  }

  async delete(task: TaskEntity): Promise<void> {
    await this.taskRepository.remove(task);
  }

  async getList(
    skip: number,
    take: number,
    {
      search,
      ownerId,
      tag,
    }: {
      search?: { keyword: string; wildcard?: WildcardType };
      ownerId?: number;
      tag?: string;
    } = {},
  ): Promise<[list: TaskEntity[], count: number]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .skip(skip)
      .take(take);
    if (search) {
      if (search.wildcard === WildcardType.NONE)
        query.andWhere('task.title = :keyword', { keyword: search.keyword });
      else {
        let keyword = search.keyword;
        if (search.wildcard === WildcardType.BOTH) keyword = `%${keyword}%`;
        else if (search.wildcard === WildcardType.BEGIN)
          keyword = `%${keyword}`;
        else if (search.wildcard === WildcardType.END) keyword = `${keyword}%`;
        query.andWhere('task.title LIKE :keyword', { keyword });
      }
    }
    if (ownerId != null) query.andWhere('task.ownerId = :ownerId', { ownerId });
    if (tag != null) query.andWhere(`JSON_CONTAINS(task.tags, '"${tag}"')`);

    return await query.getManyAndCount();
  }

  async toDto(
    task: TaskEntity,
    currentUser: UserEntity,
    customTags?: string[],
  ): Promise<TaskDto> {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      tags: customTags != null ? customTags : task.tags,
      isUsed: task.isUsed,
      ownerProfile: task.ownerId
        ? task.owner
          ? await this.userService.filterProfile(task.owner, currentUser)
          : await this.userService.getProfileById(task.ownerId, currentUser)
        : null,
    };
  }

  async checkExistenceByIds(ids: number[]): Promise<boolean> {
    return (await this.taskRepository.count({ id: In(ids) })) === ids.length;
  }

  async toTemplateTaskResponseDto(
    tasks: TemplateTaskRequestDto[],
  ): Promise<TemplateTaskResponseDto[]> {
    const list = await this.taskRepository.findByIds(
      tasks.map((task) => task.id),
    );
    return list.map((task, index) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      tags: tasks[index].tags,
      day: tasks[index].day,
    }));
  }

  private static toDtoForTrainee(
    task: TaskEntity,
    trainingTask: TrainingTaskDto,
  ): TaskForTraineeDto {
    return {
      title: task.title,
      description: task.description,
      tags: trainingTask.tags || task.tags,
      day: trainingTask.day,
      finished: trainingTask.finished,
    };
  }

  async getFromTraining(
    training: TrainingDto,
    taskId: number,
  ): Promise<TraineeGetTaskResponseDto> {
    const tasks = training.tasks;
    if (taskId < 0 || taskId >= tasks.length)
      return { error: TraineeGetTaskError.NO_SUCH_TASK };
    const task = await this.findById(tasks[taskId].id);
    if (!task) return { error: TraineeGetTaskError.NO_SUCH_TASK };

    return { task: TaskService.toDtoForTrainee(task, tasks[taskId]) };
  }

  async submitToTraining(
    training: TrainingDto,
    taskId: number,
    onSuccess?: () => Promise<any>,
  ): Promise<TraineeSubmitTaskResponseDto> {
    const tasks = training.tasks;
    if (taskId < 0 || taskId >= tasks.length)
      return { error: TraineeSubmitTaskError.NO_SUCH_TASK };
    const task = await this.findById(tasks[taskId].id);
    if (!task) return { error: TraineeSubmitTaskError.NO_SUCH_TASK };

    if (onSuccess != null) await onSuccess();

    return {};
  }

  async markAsUsed(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const res = await this.taskRepository.update(
      { id: In(ids) },
      { isUsed: true },
    );
    if (res.affected !== ids.length)
      Logger.error(
        `Only Mark ${res.affected} of ${ids.length} as used.`,
        'TaskService',
      );
    return;
  }
}
