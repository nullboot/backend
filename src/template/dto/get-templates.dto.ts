import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateBriefResponseDto } from './template.dto';
import { PaginateRequestDto, PaginateResponseDto } from '../../common/dto';

export class GetTemplatesRequestDto extends PaginateRequestDto {}

export enum GetTemplatesError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
}

export class GetTemplatesResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetTemplatesError })
  error?: GetTemplatesError;

  @ApiPropertyOptional({ type: TemplateBriefResponseDto, isArray: true })
  templates?: TemplateBriefResponseDto[];
}
