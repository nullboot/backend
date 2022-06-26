import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateResponseDto } from './template.dto';

export enum UpdateTemplateError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TEMPLATE = 'NO_SUCH_TEMPLATE',
  INVALID_EXAM = 'INVALID_EXAM',
  INVALID_TASK = 'INVALID_TASK',
  INVALID_COURSE = 'INVALID_COURSE',
}

export class UpdateTemplateResponseDto {
  @ApiPropertyOptional({ enum: UpdateTemplateError })
  error?: UpdateTemplateError;

  @ApiPropertyOptional({ type: TemplateResponseDto })
  template?: TemplateResponseDto;
}
