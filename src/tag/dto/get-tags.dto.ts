import { ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultError } from '../../common/types';
import { CityDto, DivisionDto } from './tag.dto';

export class GetDivisionsResponseDto {
  @ApiPropertyOptional({ enum: DefaultError })
  error?: DefaultError;

  @ApiPropertyOptional({ type: DivisionDto, isArray: true })
  divisions?: DivisionDto[];
}

export class GetCitiesResponseDto {
  @ApiPropertyOptional({ enum: DefaultError })
  error?: DefaultError;

  @ApiPropertyOptional({ type: CityDto, isArray: true })
  cities?: CityDto[];
}
