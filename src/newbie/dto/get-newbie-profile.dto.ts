import { ApiPropertyOptional } from '@nestjs/swagger';
import { NewbieProfileDto } from './newbie-profile.dto';
import { NewbieCommentDto } from './newbie-comment.dto';
import { TrainingDto } from '../../common/dto';

export enum GetNewbieProfileError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
}

export class GetNewbieProfileResponseDto {
  @ApiPropertyOptional({ type: NewbieProfileDto })
  profile?: NewbieProfileDto;

  @ApiPropertyOptional({ type: TrainingDto })
  training?: TrainingDto;

  /**
   * 新人对导师的评价，**不应对导师展示**
   */
  @ApiPropertyOptional({ type: NewbieCommentDto })
  comment?: NewbieCommentDto;

  @ApiPropertyOptional({ enum: GetNewbieProfileError })
  error?: GetNewbieProfileError;
}
