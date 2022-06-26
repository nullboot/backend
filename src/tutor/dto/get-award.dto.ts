import { ApiPropertyOptional } from '@nestjs/swagger';
import { TutorAwardDto } from './tutor-award.dto';

export enum GetAwardError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
}

export class GetAwardResponseDto {
  @ApiPropertyOptional({ enum: GetAwardError })
  error?: GetAwardError;

  @ApiPropertyOptional({ type: TutorAwardDto, isArray: true })
  awards?: TutorAwardDto[];
}
