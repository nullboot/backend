import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { CityDto, DivisionDto } from './tag.dto';

abstract class CreateTagRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 50)
  readonly name: string;
}

export enum CreateCityError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DUPLICATE_CITY_NAME = 'DUPLICATE_CITY_NAME',
}

export enum CreateDivisionError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DUPLICATE_DIVISION_NAME = 'DUPLICATE_DIVISION_NAME',
}

export class CreateDivisionRequestDto extends CreateTagRequestDto {}
export class CreateCityRequestDto extends CreateTagRequestDto {}

export class CreateDivisionResponseDto {
  @ApiPropertyOptional({ enum: CreateDivisionError })
  error?: CreateDivisionError;

  @ApiPropertyOptional({ type: DivisionDto })
  division?: DivisionDto;
}

export class CreateCityResponseDto {
  @ApiPropertyOptional({ enum: CreateCityError })
  error?: CreateCityError;

  @ApiPropertyOptional({ type: CityDto })
  city?: CityDto;
}
