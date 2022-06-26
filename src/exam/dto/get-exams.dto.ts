import {
  PaginateRequestDto,
  PaginateResponseDto,
  WildcardType,
} from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsIntInQuery } from '../../common/validators';
import { ExamDto } from './exam.dto';

export class GetExamsRequestDto extends PaginateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIntInQuery()
  ownerId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(WildcardType)
  wildcard?: WildcardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;
}

export enum GetExamsError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
}

export class GetExamsResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetExamsError })
  error?: GetExamsError;

  @ApiPropertyOptional({ type: ExamDto, isArray: true })
  exams?: ExamDto[];
}
