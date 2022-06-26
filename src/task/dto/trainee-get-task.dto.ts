import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskForTraineeDto } from './task.dto';

export enum TraineeGetTaskError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NO_SUCH_TASK = 'NO_SUCH_TASK',
}

export class TraineeGetTaskResponseDto {
  @ApiPropertyOptional({ enum: TraineeGetTaskError })
  error?: TraineeGetTaskError;

  @ApiPropertyOptional()
  task?: TaskForTraineeDto;
}
