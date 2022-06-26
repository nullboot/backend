import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ExamAnswersRequestDto, ExamAnswersResponseDto } from './index';
import { Type } from 'class-transformer';

export class TraineeSubmitExamRequestDto {
  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswersRequestDto)
  @ArrayNotEmpty()
  @IsArray()
  readonly answers: ExamAnswersRequestDto[];
}

export enum TraineeSubmitExamError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NO_SUCH_EXAM = 'NO_SUCH_EXAM',
  INVALID_ANSWER = 'INVALID_ANSWER',
  INVALID_ANSWER_COUNT = 'INVALID_ANSWER_COUNT',
}

export class TraineeSubmitExamResponseDto {
  @ApiPropertyOptional({ enum: TraineeSubmitExamError })
  error?: TraineeSubmitExamError;

  @ApiPropertyOptional()
  passed?: boolean;

  @ApiPropertyOptional({ type: ExamAnswersResponseDto, isArray: true })
  results?: ExamAnswersResponseDto[];
}
