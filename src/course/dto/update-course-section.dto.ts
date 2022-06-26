import { CourseSectionDto } from './course-section.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum UpdateCourseSectionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_SECTION = 'NO_SUCH_SECTION',
  NO_SUCH_FILE = 'NO_SUCH_FILE',
}

export class UpdateCourseSectionResponseDto {
  @ApiPropertyOptional({
    enum: UpdateCourseSectionError,
    description: '错误信息',
  })
  error?: UpdateCourseSectionError;

  @ApiPropertyOptional({ type: CourseSectionDto, description: '章节信息' })
  section?: CourseSectionDto;
}
