import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateResponseDto } from './template.dto';

export enum GetTemplateError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TEMPLATE = 'NO_SUCH_TEMPLATE',
}

export class GetTemplateResponseDto {
  @ApiPropertyOptional({ enum: GetTemplateError })
  error?: GetTemplateError;

  @ApiPropertyOptional({ type: TemplateResponseDto })
  template?: TemplateResponseDto;
}
