import { ApiPropertyOptional } from '@nestjs/swagger';
import { NewbieCommentDto } from './newbie-comment.dto';
import { NewbieProfileDto } from './newbie-profile.dto';

export enum UpdateNewbieCommentError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NEWBIE_NOT_ASSIGNED = 'NEWBIE_NOT_ASSIGNED',
  NEWBIE_GRADUATED = 'NEWBIE_GRADUATED',
  NO_SUCH_RECORD = 'NO_SUCH_RECORD',
  REQUIRE_SCORE = 'REQUIRE_SCORE',
}

export class UpdateNewbieCommentResponseDto {
  @ApiPropertyOptional({ enum: UpdateNewbieCommentError })
  error?: UpdateNewbieCommentError;

  @ApiPropertyOptional({ type: NewbieCommentDto })
  comment?: NewbieCommentDto;

  @ApiPropertyOptional({ type: NewbieProfileDto })
  profile?: NewbieProfileDto;
}
