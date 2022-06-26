import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { arrayData, numberData } from '../../common/types';

export enum GetTutorDataShowError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY_MONTHS = 'TAKE_TOO_MANY_MONTHS',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
}

export class GetTutorDataShowRequestDto {
  @ApiPropertyOptional()
  @IsString()
  startTime: string;

  @ApiPropertyOptional()
  @IsString()
  endTime: string;
}

export class GetTutorDataShowResponseDto {
  @ApiPropertyOptional({ enum: GetTutorDataShowError })
  error?: GetTutorDataShowError;

  @ApiPropertyOptional({ type: arrayData, isArray: true, default: [] })
  basis?: arrayData[] = [];

  @ApiPropertyOptional({ type: arrayData, isArray: true, default: [] })
  approval?: arrayData[] = [];

  @ApiPropertyOptional({ type: arrayData, isArray: true, default: [] })
  assignment?: arrayData[] = [];

  @ApiPropertyOptional({ type: numberData, isArray: true, default: [] })
  score?: numberData[] = [];
}
