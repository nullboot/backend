import { ExamDto, ExamRequestDto } from './exam.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateExamRequestDto extends ExamRequestDto {}

export enum UpdateExamError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_EXAM = 'NO_SUCH_EXAM',
  INVALID_ANSWER = 'INVALID_ANSWER',
}

export class UpdateExamResponseDto {
  @ApiPropertyOptional({ enum: UpdateExamError })
  error?: UpdateExamError;

  @ApiPropertyOptional({ type: ExamDto })
  exam?: ExamDto;
}
