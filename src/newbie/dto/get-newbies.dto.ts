import { PaginateResponseDto, PaginateUserRequestDto } from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { NewbieProfileDto } from './newbie-profile.dto';
import { IsBooleanInQuery, IsIntInQuery } from '../../common/validators';
import { NewbieCommentDto } from './newbie-comment.dto';

export enum NewbieStatus {
  graduated = 'graduated', // 已毕业
  training = 'training', // 培训中
  preparing = 'preparing', // 无培训（TUTOR未分配培训）
  pending = 'pending', // 无导师
}

export class GetNewbiesRequestDto extends PaginateUserRequestDto {
  @ApiPropertyOptional({ enum: NewbieStatus })
  @IsOptional()
  @IsEnum(NewbieStatus)
  status?: NewbieStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIntInQuery()
  tutorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanInQuery()
  pendingFirst?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanInQuery()
  getComments?: boolean;
}

export enum GetNewbiesError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  INVALID_CITY = 'INVALID_CITY',
  INVALID_DIVISION = 'INVALID_DIVISION',
}

export class GetNewbiesResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetNewbiesError })
  error?: GetNewbiesError;

  @ApiPropertyOptional({ isArray: true, type: NewbieProfileDto })
  newbies?: NewbieProfileDto[];

  /**
   * 导师对新人的评价，其中没有标注 newbieId，与 newbies 一一对应
   */
  @ApiPropertyOptional({ isArray: true, type: NewbieCommentDto })
  comments?: NewbieCommentDto[];
}
