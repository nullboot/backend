import { TaskDto, TaskRequestDto } from './task.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskRequestDto extends TaskRequestDto {}

export enum CreateTaskError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export class CreateTaskResponseDto {
  @ApiPropertyOptional({ enum: CreateTaskError })
  error?: CreateTaskError;

  @ApiPropertyOptional({ type: TaskDto })
  task?: TaskDto;
}
