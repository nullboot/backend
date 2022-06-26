import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseForTraineeDto } from './course.dto';

export enum TraineeGetCourseError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NO_SUCH_COURSE = 'NO_SUCH_COURSE',
}

export class TraineeGetCourseResponseDto {
  @ApiPropertyOptional({ enum: TraineeGetCourseError, description: '错误信息' })
  error?: TraineeGetCourseError;

  @ApiPropertyOptional({ type: CourseForTraineeDto, description: '课程信息' })
  course?: CourseForTraineeDto;
}
