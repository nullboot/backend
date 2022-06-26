import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TraineeSubmitTaskError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TASK = 'NO_SUCH_TASK',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
}

export class TraineeSubmitTaskResponseDto {
  @ApiPropertyOptional({ enum: TraineeSubmitTaskError })
  error?: TraineeSubmitTaskError;
}
