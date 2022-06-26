import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { NewbieProfileDto } from './newbie-profile.dto';

export class AssignNewbieTutorRequestDto {
  @ApiProperty()
  @IsInt()
  tutorId: number;
}

export enum AssignNewbieTutorError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_NEWBIE = 'NO_SUCH_NEWBIE',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  TUTOR_NOT_GRADUATE = 'TUTOR_NOT_GRADUATE',
  NEWBIE_IS_ASSIGNED = 'NEWBIE_IS_ASSIGNED',
}

export class AssignNewbieTutorResponseDto {
  @ApiPropertyOptional({ enum: AssignNewbieTutorError })
  error?: AssignNewbieTutorError;

  @ApiPropertyOptional({ type: NewbieProfileDto })
  profile?: NewbieProfileDto;
}
