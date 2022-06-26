import {
  PaginateRequestDto,
  PaginateResponseDto,
  WildcardType,
} from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsIntInQuery } from '../../common/validators';
import { CourseBriefDto } from './course.dto';

export class GetCoursesRequestDto extends PaginateRequestDto {
  @ApiPropertyOptional({ description: '筛选：创建者Id' })
  @IsOptional()
  @IsIntInQuery()
  ownerId?: number;

  @ApiPropertyOptional({ description: '搜索：关键字（标题）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '搜索：通配符位置' })
  @IsOptional()
  @IsEnum(WildcardType)
  wildcard?: WildcardType;

  @ApiPropertyOptional({ description: '筛选：标签' })
  @IsOptional()
  @IsString()
  tag?: string;
}

export enum GetCoursesError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
}

export class GetCoursesResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetCoursesError, description: '错误信息' })
  error?: GetCoursesError;

  @ApiPropertyOptional({
    type: CourseBriefDto,
    isArray: true,
    description: '课程列表',
  })
  courses?: CourseBriefDto[];
}
