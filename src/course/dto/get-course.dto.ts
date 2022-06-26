import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseDto } from './course.dto';

export enum GetCourseError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_COURSE = 'NO_SUCH_COURSE',
}

export class GetCourseResponseDto {
  @ApiPropertyOptional({ enum: GetCourseError, description: '错误信息' })
  error?: GetCourseError;

  @ApiPropertyOptional({ type: CourseDto, description: '课程信息' })
  course?: CourseDto;
}
