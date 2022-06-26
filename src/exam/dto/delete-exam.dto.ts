import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeleteExamError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_EXAM = 'NO_SUCH_EXAM',
  ALREADY_USED = 'ALREADY_USED',
}

export class DeleteExamResponseDto {
  @ApiPropertyOptional({ enum: DeleteExamError })
  error?: DeleteExamError;
}
