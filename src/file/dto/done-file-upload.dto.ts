import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';
import { FileInfoDto } from './file-info.dto';

export class DoneFileUploadRequestDto {
  @ApiProperty()
  @IsUUID()
  uuid: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  size: number;
}

export enum DoneFileUploadError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_UUID_EXISTS = 'FILE_UUID_EXISTS',
  FILE_NOT_UPLOADED = 'FILE_NOT_UPLOADED',
}

export class DoneFileUploadResponseDto {
  @ApiPropertyOptional({ enum: DoneFileUploadError })
  error?: DoneFileUploadError;

  @ApiPropertyOptional({ type: FileInfoDto })
  fileInfo?: FileInfoDto;
}
