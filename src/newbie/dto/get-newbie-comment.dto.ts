import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewbieCommentDto } from './newbie-comment.dto';
import { IsEnum } from 'class-validator';
import { NewbieCommentType } from '../newbie-comment.entity';

export class GetNewbieCommentRequestDto {
  @ApiProperty({ enum: NewbieCommentType })
  @IsEnum(NewbieCommentType)
  type: NewbieCommentType;
}

export enum GetNewbieCommentError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_COMMENT = 'NO_SUCH_COMMENT',
  NEWBIE_NOT_ASSIGNED = 'NEWBIE_NOT_ASSIGNED',
}

export class GetNewbieCommentResponseDto {
  @ApiPropertyOptional({ enum: GetNewbieCommentError })
  error?: GetNewbieCommentError;

  @ApiPropertyOptional({ type: NewbieCommentDto })
  comment?: NewbieCommentDto;

  @ApiPropertyOptional({ type: NewbieCommentDto, isArray: true })
  comments?: NewbieCommentDto[];
}
