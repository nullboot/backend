import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateResponseDto } from '../../template/dto';

export enum GetNewbieTemplateError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_TUTOR_ASSIGNED = 'NO_TUTOR_ASSIGNED',
}

export class GetNewbieTemplateResponseDto {
  @ApiPropertyOptional({ enum: GetNewbieTemplateError })
  error?: GetNewbieTemplateError;

  @ApiPropertyOptional({ type: TemplateResponseDto })
  template?: TemplateResponseDto;
}
