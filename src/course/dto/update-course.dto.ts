import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseDto } from './course.dto';

export enum UpdateCourseError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_COURSE = 'NO_SUCH_COURSE',
  INVALID_SECTION = 'INVALID_SECTION',
}

export class UpdateCourseResponseDto {
  @ApiPropertyOptional({ enum: UpdateCourseError, description: '错误信息' })
  error?: UpdateCourseError;

  @ApiPropertyOptional({ type: CourseDto, description: '课程信息' })
  course?: CourseDto;
}
