import { ApiProperty } from '@nestjs/swagger';

export class FileInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  uuid: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  downloadLink: string;

  @ApiProperty()
  uploadTime: Date;
}
