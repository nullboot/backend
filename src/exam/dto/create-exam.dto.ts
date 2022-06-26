import { ExamDto, ExamRequestDto } from './exam.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamRequestDto extends ExamRequestDto {}

export enum CreateExamError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_ANSWER = 'INVALID_ANSWER',
}

export class CreateExamResponseDto {
  @ApiPropertyOptional({ enum: CreateExamError })
  error?: CreateExamError;

  @ApiPropertyOptional({ type: ExamDto })
  exam?: ExamDto;
}
