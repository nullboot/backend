import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseSectionDto } from './course-section.dto';

export enum GetCourseSectionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_SECTION = 'NO_SUCH_SECTION',
}

export class GetCourseSectionResponseDto {
  @ApiPropertyOptional({ enum: GetCourseSectionError, description: '错误信息' })
  error?: GetCourseSectionError;

  @ApiPropertyOptional({ type: CourseSectionDto, description: '章节信息' })
  section?: CourseSectionDto;
}
