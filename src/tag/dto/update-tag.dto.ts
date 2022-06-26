import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { CityDto, DivisionDto } from './tag.dto';

abstract class UpdateTagRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 50)
  readonly name: string;
}

export class UpdateDivisionRequestDto extends UpdateTagRequestDto {}
export class UpdateCityRequestDto extends UpdateTagRequestDto {}

export enum UpdateDivisionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_DIVISION = 'NO_SUCH_DIVISION',
  DUPLICATE_DIVISION_NAME = 'DUPLICATE_DIVISION_NAME',
}

export enum UpdateCityError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_CITY = 'NO_SUCH_CITY',
  DUPLICATE_CITY_NAME = 'DUPLICATE_CITY_NAME',
}

export class UpdateDivisionResponseDto {
  @ApiPropertyOptional({ enum: UpdateDivisionError })
  error?: UpdateDivisionError;

  @ApiPropertyOptional({ type: DivisionDto })
  division?: DivisionDto;
}

export class UpdateCityResponseDto {
  @ApiPropertyOptional({ enum: UpdateCityError })
  error?: UpdateCityError;

  @ApiPropertyOptional({ type: CityDto })
  city?: CityDto;
}
