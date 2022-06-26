import { TaskDto, TaskRequestDto } from './task.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskRequestDto extends TaskRequestDto {}

export enum UpdateTaskError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TASK = 'NO_SUCH_TASK',
}

export class UpdateTaskResponseDto {
  @ApiPropertyOptional({ enum: UpdateTaskError })
  error?: UpdateTaskError;

  @ApiPropertyOptional({ type: TaskDto })
  task?: TaskDto;
}
