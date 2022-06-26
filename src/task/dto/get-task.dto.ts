import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskDto } from './task.dto';

export enum GetTaskError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TASK = 'NO_SUCH_TASK',
}

export class GetTaskResponseDto {
  @ApiPropertyOptional()
  error?: GetTaskError;

  @ApiPropertyOptional()
  task?: TaskDto;
}
