import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/role';
import { ArrayUnique, IsEnum } from 'class-validator';
import { UserProfileDto } from './user-profile.dto';

export class UpdateUserRolesRequestDto {
  @ApiProperty({ isArray: true, enum: Role })
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  readonly roles: Role[];
}

export enum UpdateUserRolesError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
}

export class UpdateUserRolesResponseDto {
  @ApiPropertyOptional({ enum: UpdateUserRolesError })
  error?: UpdateUserRolesError;

  @ApiPropertyOptional({ type: UserProfileDto })
  profile?: UserProfileDto;
}
