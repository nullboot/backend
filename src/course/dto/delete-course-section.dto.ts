import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeleteCourseSectionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_SECTION = 'NO_SUCH_SECTION',
  ALREADY_USED = 'ALREADY_USED',
}

export class DeleteCourseSectionResponseDto {
  @ApiPropertyOptional({
    enum: DeleteCourseSectionError,
    description: '错误信息',
  })
  error?: DeleteCourseSectionError;
}
