import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { SignedFileUploadRequestDto } from './signed-file-upload-request.dto';

export class SignFileUploadRequestDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  size: number;
}

export enum SignFileUploadError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

export class SignFileUploadResponseDto {
  @ApiPropertyOptional({ enum: SignFileUploadError })
  error?: SignFileUploadError;

  @ApiPropertyOptional({ type: SignedFileUploadRequestDto })
  signedRequest?: SignedFileUploadRequestDto;
}
