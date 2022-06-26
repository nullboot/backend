import { ApiProperty } from '@nestjs/swagger';
import {
  CourseSectionDto,
  CourseSectionForTraineeDto,
} from './course-section.dto';
import { UserProfileDto } from '../../user/dto';
import { ArrayUnique, IsArray, IsInt, IsString, Length } from 'class-validator';

abstract class CourseBaseDto {
  @ApiProperty({ description: '课程Id' })
  id: number;

  @ApiProperty({ description: '标题' })
  title: string;

  @ApiProperty({ description: '详情' })
  description: string;

  @ApiProperty({ description: '标签列表' })
  tags: string[];

  @ApiProperty({ type: UserProfileDto, description: '创建者信息' })
  ownerProfile: UserProfileDto;

  @ApiProperty({ description: '是否被使用' })
  isUsed: boolean;
}

export class CourseBriefDto extends CourseBaseDto {
  @ApiProperty()
  sectionCount: number;
}

export class CourseDto extends CourseBaseDto {
  @ApiProperty({ type: CourseSectionDto, isArray: true })
  sections: CourseSectionDto[];
}

export class CourseRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 80)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString({ each: true })
  @IsArray()
  @ArrayUnique()
  tags: string[];

  @ApiProperty()
  @IsInt({ each: true })
  @IsArray()
  @ArrayUnique()
  sectionIds: number[];
}

export class CourseForTraineeDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  isOptional: boolean;

  @ApiProperty()
  day: number;

  @ApiProperty({ type: CourseSectionForTraineeDto, isArray: true })
  sections: CourseSectionForTraineeDto[];

  @ApiProperty()
  finished: boolean;
}
