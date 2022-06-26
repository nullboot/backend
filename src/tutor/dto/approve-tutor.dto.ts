import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { TutorProfileDto } from './tutor-profile.dto';

export class ApproveTutorRequestDto {
  @ApiProperty()
  @IsBoolean()
  approve: boolean;
}

export enum ApproveTutorError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  ALREADY_APPROVED = 'ALREADY_APPROVED',
  ALREADY_REJECTED = 'ALREADY_REJECTED',
}

export class ApproveTutorResponseDto {
  @ApiPropertyOptional({ enum: ApproveTutorError })
  error?: ApproveTutorError;

  @ApiPropertyOptional({ type: TutorProfileDto })
  profile?: TutorProfileDto;
}
