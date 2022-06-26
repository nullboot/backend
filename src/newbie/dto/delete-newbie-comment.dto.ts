import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeleteNewbieCommentError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_COMMENT = 'NO_SUCH_COMMENT',
}

export class DeleteNewbieCommentResponseDto {
  @ApiPropertyOptional({ enum: DeleteNewbieCommentError })
  error?: DeleteNewbieCommentError;
}
