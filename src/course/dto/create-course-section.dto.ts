import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseSectionDto } from './course-section.dto';

export enum CreateCourseSectionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_FILE = 'NO_SUCH_FILE',
}

export class CreateCourseSectionResponseDto {
  @ApiPropertyOptional({
    enum: CreateCourseSectionError,
    description: '错误信息',
  })
  error?: CreateCourseSectionError;

  @ApiPropertyOptional({ type: CourseSectionDto, description: '章节信息' })
  section?: CourseSectionDto;
}
