import {
  PaginateRequestDto,
  PaginateResponseDto,
  WildcardType,
} from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsIntInQuery } from '../../common/validators';
import { TaskDto } from './task.dto';

export enum GetTasksError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
}

export class GetTasksRequestDto extends PaginateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIntInQuery()
  ownerId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(WildcardType)
  wildcard?: WildcardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;
}

export class GetTasksResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetTasksError })
  error?: GetTasksError;

  @ApiPropertyOptional({ type: TaskDto, isArray: true })
  tasks?: TaskDto[];
}
