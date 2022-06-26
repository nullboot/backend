import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateType } from '../template.entity';
import { DivisionDto } from '../../tag/dto';

export class TemplateItemRequestDto {
  @ApiProperty({ description: '培训项Id' })
  @IsInt()
  id: number;

  @ApiProperty({ description: '建议学习日期' })
  @IsInt()
  day: number;

  @ApiProperty({ description: '标签列表' })
  @ArrayUnique()
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class TemplateExamRequestDto extends TemplateItemRequestDto {}

export class TemplateTaskRequestDto extends TemplateItemRequestDto {}

export class TemplateCourseRequestDto extends TemplateItemRequestDto {
  @ApiProperty({ description: '是否选修' })
  @IsBoolean()
  isOptional: boolean;
}

export class TemplateRequestDto {
  @ApiProperty({
    type: TemplateExamRequestDto,
    isArray: true,
    description: '考试列表',
  })
  @ValidateNested()
  @Type(() => TemplateExamRequestDto)
  @IsArray()
  exams: TemplateExamRequestDto[];

  @ApiProperty({
    type: TemplateTaskRequestDto,
    isArray: true,
    description: '任务列表',
  })
  @ValidateNested()
  @Type(() => TemplateTaskRequestDto)
  @IsArray()
  tasks: TemplateTaskRequestDto[];

  @ApiProperty({
    type: TemplateCourseRequestDto,
    isArray: true,
    description: '课程列表',
  })
  @ValidateNested()
  @Type(() => TemplateCourseRequestDto)
  @IsArray()
  courses: TemplateCourseRequestDto[];
}

export class TemplateItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  day: number;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;
}

export class TemplateExamResponseDto extends TemplateItemResponseDto {}

export class TemplateTaskResponseDto extends TemplateItemResponseDto {}

export class TemplateCourseResponseDto extends TemplateItemResponseDto {
  @ApiProperty()
  isOptional: boolean;
}

export class TemplateBriefResponseDto {
  @ApiProperty({ enum: TemplateType })
  type: TemplateType;

  @ApiProperty({ type: DivisionDto })
  division: DivisionDto;

  @ApiProperty()
  examCount: number;

  @ApiProperty()
  taskCount: number;

  @ApiProperty()
  courseCount: number;
}

export class TemplateResponseDto {
  @ApiProperty({ enum: TemplateType })
  type: TemplateType;

  @ApiProperty({ type: DivisionDto })
  division: DivisionDto;

  @ApiProperty({ type: TemplateExamResponseDto, isArray: true })
  exams: TemplateExamResponseDto[];

  @ApiProperty({ type: TemplateTaskResponseDto, isArray: true })
  tasks: TemplateTaskResponseDto[];

  @ApiProperty({ type: TemplateCourseResponseDto, isArray: true })
  courses: TemplateCourseResponseDto[];
}
