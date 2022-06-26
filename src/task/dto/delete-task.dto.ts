import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeleteTaskError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TASK = 'NO_SUCH_TASK',
  ALREADY_USED = 'ALREADY_USED',
}

export class DeleteTaskResponseDto {
  @ApiPropertyOptional({ enum: DeleteTaskError })
  error?: DeleteTaskError;
}
