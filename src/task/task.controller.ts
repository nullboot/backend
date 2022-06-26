import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './task.service';
import { CurrentUser } from '../common/user.decorator';
import { IntParam } from '../common/validators';
import { hasRoleOrRoot, Role } from '../common/role';
import { GetTaskError, GetTaskResponseDto } from './dto';
import {
  CreateTaskError,
  CreateTaskRequestDto,
  CreateTaskResponseDto,
  DeleteTaskError,
  DeleteTaskResponseDto,
  GetTasksError,
  GetTasksRequestDto,
  GetTasksResponseDto,
  UpdateTaskError,
  UpdateTaskRequestDto,
  UpdateTaskResponseDto,
} from './dto';
import { WildcardType } from '../common/dto';

@ApiTags('TRAINING::Task')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get(':id')
  @ApiOperation({
    summary: '获取任务信息',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getTask(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<GetTaskResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetTaskError.PERMISSION_DENIED };

    const task = await this.taskService.findById(id, true);
    if (!task) return { error: GetTaskError.NO_SUCH_TASK };

    return { task: await this.taskService.toDto(task, currentUser) };
  }

  /**
   * NOTE:
   * We should put `POST new` BEFORE `POST :id`.
   * Otherwise Express will process `POST new` as `POST :id` as id = 'new'.
   */
  @Post('new')
  @ApiOperation({
    summary: '创建任务',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async createTask(
    @CurrentUser() currentUser,
    @Body() body: CreateTaskRequestDto,
  ): Promise<CreateTaskResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: CreateTaskError.PERMISSION_DENIED };

    const task = await this.taskService.create(body, currentUser);
    return { task: await this.taskService.toDto(task, currentUser) };
  }

  @Post(':id')
  @ApiOperation({
    summary: '更新任务信息',
    description: '只有 ADMIN 和 ROOT 具有权限；ADMIN 只能更新自己创建的课程',
  })
  async updateTask(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
    @Body() body: UpdateTaskRequestDto,
  ): Promise<UpdateTaskResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: UpdateTaskError.PERMISSION_DENIED };
    let task = await this.taskService.findById(id);
    if (!task) return { error: UpdateTaskError.NO_SUCH_TASK };
    if (currentUser.id !== task.ownerId && !currentUser.isRoot)
      return { error: UpdateTaskError.PERMISSION_DENIED };

    task = await this.taskService.update(task, body);
    return { task: await this.taskService.toDto(task, currentUser) };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除任务',
    description:
      '只有 ADMIN 和 ROOT 具有权限；任务未被使用时才能删除；ADMIN 只能删除自己创建的任务',
  })
  async deleteTask(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<DeleteTaskResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: DeleteTaskError.PERMISSION_DENIED };
    const task = await this.taskService.findById(id);
    if (!task) return { error: DeleteTaskError.NO_SUCH_TASK };
    if (currentUser.id !== task.ownerId && !currentUser.isRoot)
      return { error: DeleteTaskError.PERMISSION_DENIED };
    if (task.isUsed) return { error: DeleteTaskError.ALREADY_USED };

    await this.taskService.delete(task);

    return {};
  }

  @ApiTags('LIST')
  @Get('')
  @ApiOperation({
    summary: '获取任务列表',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getTasks(
    @CurrentUser() currentUser,
    @Query() req: GetTasksRequestDto,
  ): Promise<GetTasksResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetTasksError.PERMISSION_DENIED };

    if (req.take > 100) return { error: GetTasksError.TAKE_TOO_MANY };

    const [list, count] = await this.taskService.getList(req.skip, req.take, {
      search: req.keyword
        ? { keyword: req.keyword, wildcard: req.wildcard || WildcardType.BOTH }
        : undefined,
      ownerId: req.ownerId,
      tag: req.tag,
    });

    return {
      tasks: await Promise.all(
        list.map((task) => this.taskService.toDto(task, currentUser)),
      ),
      count,
    };
  }
}
