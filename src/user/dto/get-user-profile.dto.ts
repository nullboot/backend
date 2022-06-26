import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileDto } from './user-profile.dto';

export enum GetUserProfileError {
  NO_SUCH_USER = 'NO_SUCH_USER',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export class GetUserProfileResponseDto {
  @ApiPropertyOptional({ enum: GetUserProfileError })
  error?: GetUserProfileError;

  @ApiPropertyOptional()
  profile?: UserProfileDto;
}
