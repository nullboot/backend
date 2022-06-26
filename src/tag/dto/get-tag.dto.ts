import { ApiPropertyOptional } from '@nestjs/swagger';
import { CityDto, DivisionDto } from './tag.dto';

export enum GetDivisionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_DIVISION = 'NO_SUCH_DIVISION',
}

export enum GetCityError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_CITY = 'NO_SUCH_CITY',
}

export class GetCityResponseDto {
  @ApiPropertyOptional({ enum: GetCityError })
  error?: GetCityError;

  @ApiPropertyOptional({ type: CityDto })
  city?: CityDto;
}

export class GetDivisionResponseDto {
  @ApiPropertyOptional({ enum: GetDivisionError })
  error?: GetDivisionError;

  @ApiPropertyOptional({ type: DivisionDto })
  division?: DivisionDto;
}
