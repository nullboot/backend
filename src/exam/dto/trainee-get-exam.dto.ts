import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExamForTraineeDto } from './index';

export enum TraineeGetExamError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NO_SUCH_EXAM = 'NO_SUCH_EXAM',
}

export class TraineeGetExamResponseDto {
  @ApiPropertyOptional({ enum: TraineeGetExamError })
  error?: TraineeGetExamError;

  @ApiPropertyOptional({ type: ExamForTraineeDto })
  exam?: ExamForTraineeDto;
}
