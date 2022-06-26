import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeleteCourseError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_COURSE = 'NO_SUCH_COURSE',
  ALREADY_USED = 'ALREADY_USED',
}

export class DeleteCourseResponseDto {
  @ApiPropertyOptional({ enum: DeleteCourseError, description: '错误信息' })
  error?: DeleteCourseError;
}
