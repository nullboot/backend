import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DeleteDivisionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_DIVISION = 'NO_SUCH_DIVISION',
  DIVISION_NOT_EMPTY = 'DIVISION_NOT_EMPTY',
}

export enum DeleteCityError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_CITY = 'NO_SUCH_CITY',
}

export class DeleteDivisionResponseDto {
  @ApiPropertyOptional({ enum: DeleteDivisionError })
  error?: DeleteDivisionError;
}

export class DeleteCityResponseDto {
  @ApiPropertyOptional({ enum: DeleteCityError })
  error?: DeleteCityError;
}
