import { ApiPropertyOptional } from '@nestjs/swagger';
import { TutorProfileDto } from './tutor-profile.dto';

export enum NominateTutorError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
  ALREADY_NOMINATED = 'ALREADY_NOMINATED',
}

export class NominateTutorResponseDto {
  @ApiPropertyOptional({ enum: NominateTutorError })
  error?: NominateTutorError;

  @ApiPropertyOptional({ type: TutorProfileDto })
  profile?: TutorProfileDto;
}
