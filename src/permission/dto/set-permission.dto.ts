import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class SetPermissionRequestDto {
  @ApiProperty()
  @IsInt({ each: true })
  @ArrayUnique()
  @IsArray()
  readonly divisionIds: number[];
}

export enum SetPermissionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_ADMIN = 'NO_SUCH_ADMIN',
  NO_SUCH_HRBP = 'NO_SUCH_HRBP',
  INVALID_DIVISION = 'INVALID_DIVISION',
}

export class SetPermissionResponseDto {
  @ApiPropertyOptional({ enum: SetPermissionError })
  error?: SetPermissionError;
}
