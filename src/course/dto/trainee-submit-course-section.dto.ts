import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TraineeSubmitCourseSectionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NO_SUCH_COURSE = 'NO_SUCH_COURSE',
  NO_SUCH_SECTION = 'NO_SUCH_SECTION',
}

export class TraineeSubmitCourseSectionResponseDto {
  @ApiPropertyOptional({
    enum: TraineeSubmitCourseSectionError,
    description: '错误信息',
  })
  error?: TraineeSubmitCourseSectionError;
}
