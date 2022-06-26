import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';
import { CityDto, DivisionDto } from '../../tag/dto';

export class addTagRequestDto {
  @ApiProperty()
  @IsNumber()
  readonly divisionId?: number;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  readonly divisionName?: string;

  @ApiProperty()
  @IsNumber()
  readonly cityId?: number;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  readonly cityName?: string;
}

export class addTagResponseDto {
  @ApiPropertyOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional()
  city?: CityDto;

  @ApiPropertyOptional()
  division?: DivisionDto;
}
