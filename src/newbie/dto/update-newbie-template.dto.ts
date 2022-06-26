import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateRequestDto, TemplateResponseDto } from '../../template/dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNewbieTemplateRequestDto extends TemplateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly assignToNewbie?: boolean;
}

export enum UpdateNewbieTemplateError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_TUTOR_ASSIGNED = 'NO_TUTOR_ASSIGNED',
  TRAINING_ASSIGNED = 'TRAINING_ASSIGNED',
  INVALID_EXAM = 'INVALID_EXAM',
  INVALID_TASK = 'INVALID_TASK',
  INVALID_COURSE = 'INVALID_COURSE',
}

export class UpdateNewbieTemplateResponseDto {
  @ApiPropertyOptional({ enum: UpdateNewbieTemplateError })
  error?: UpdateNewbieTemplateError;

  @ApiPropertyOptional({ type: TemplateResponseDto })
  template?: TemplateResponseDto;
}
