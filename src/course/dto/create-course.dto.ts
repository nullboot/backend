import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseDto } from './course.dto';

export enum CreateCourseError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_SECTION = 'INVALID_SECTION',
}

export class CreateCourseResponseDto {
  @ApiPropertyOptional({ enum: CreateCourseError, description: '错误信息' })
  error?: CreateCourseError;

  @ApiPropertyOptional({ type: CourseDto, description: '课程信息' })
  course?: CourseDto;
}
