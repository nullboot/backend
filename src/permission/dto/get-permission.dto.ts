import { ApiPropertyOptional } from '@nestjs/swagger';
import { DivisionDto } from '../../tag/dto';

export enum GetPermissionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_ADMIN = 'NO_SUCH_ADMIN',
  NO_SUCH_HRBP = 'NO_SUCH_HRBP',
}

export class GetPermissionResponseDto {
  @ApiPropertyOptional({ enum: GetPermissionError })
  error?: GetPermissionError;

  @ApiPropertyOptional({ type: DivisionDto, isArray: true })
  divisions?: DivisionDto[];
}
