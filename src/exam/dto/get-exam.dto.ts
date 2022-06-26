import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExamDto } from './exam.dto';

export enum GetExamError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_EXAM = 'NO_SUCH_EXAM',
}

export class GetExamResponseDto {
  @ApiPropertyOptional()
  error?: GetExamError;

  @ApiPropertyOptional()
  exam?: ExamDto;
}
