import {
  PaginateRequestDto,
  PaginateResponseDto,
  WildcardType,
} from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DefaultPaginateError } from '../../common/types';
import { CourseSectionType } from '../course-section.entity';
import { CourseSectionDto } from './course-section.dto';

export class GetCourseSectionsRequestDto extends PaginateRequestDto {
  @ApiPropertyOptional({ description: '搜索：关键字（标题）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '搜索：通配符位置' })
  @IsOptional()
  @IsEnum(WildcardType)
  wildcard?: WildcardType;

  @ApiPropertyOptional({ description: '筛选：章节类型' })
  @IsOptional()
  @IsEnum(CourseSectionType)
  type?: CourseSectionType;
}

export class GetCourseSectionsResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: DefaultPaginateError, description: '错误信息' })
  error?: DefaultPaginateError;

  @ApiPropertyOptional({
    type: CourseSectionDto,
    isArray: true,
    description: '章节列表',
  })
  sections?: CourseSectionDto[];
}
