import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignedFileUploadRequestDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  extraFormData?: unknown;

  @ApiPropertyOptional()
  fileFieldName?: string;
}
