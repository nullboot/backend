import { ProblemDto } from './exam.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParseExamCsvFileRequestDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}

export enum ParseExamCsvFileError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
}

export class ParseExamCsvFileResponseDto {
  @ApiPropertyOptional({ enum: ParseExamCsvFileError })
  error?: ParseExamCsvFileError;

  @ApiPropertyOptional({ type: ProblemDto, isArray: true })
  problems?: ProblemDto[];
}
