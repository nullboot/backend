import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { arrayData, numberData } from '../../common/types';

export enum GetNewbieDataShowError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY_MONTHS = 'TAKE_TOO_MANY_MONTHS',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
}

export class GetNewbieDataShowRequestDto {
  @ApiPropertyOptional()
  @IsString()
  startTime: string;

  @ApiPropertyOptional()
  @IsString()
  endTime: string;
}

export class GetNewbieDataShowResponseDto {
  @ApiPropertyOptional({ enum: GetNewbieDataShowError })
  error?: GetNewbieDataShowError;

  @ApiPropertyOptional({ type: arrayData, isArray: true, default: [] })
  basis?: arrayData[] = [];

  @ApiPropertyOptional({ type: arrayData, isArray: true, default: [] })
  training?: arrayData[] = [];

  @ApiPropertyOptional({ type: arrayData, isArray: true, default: [] })
  graduate?: arrayData[] = [];

  @ApiPropertyOptional({ type: numberData, isArray: true, default: [] })
  score?: numberData[] = [];
}
