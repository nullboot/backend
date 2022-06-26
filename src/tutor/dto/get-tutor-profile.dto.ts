import { ApiPropertyOptional } from '@nestjs/swagger';
import { TutorProfileDto } from './tutor-profile.dto';
import { TrainingDto } from '../../common/dto';

export enum GetTutorProfileError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
}

export class GetTutorProfileResponseDto {
  @ApiPropertyOptional({ type: TutorProfileDto })
  profile?: TutorProfileDto;

  @ApiPropertyOptional({ type: TrainingDto })
  training?: TrainingDto;

  @ApiPropertyOptional({ enum: GetTutorProfileError })
  error?: GetTutorProfileError;
}
