import { PaginateResponseDto, PaginateUserRequestDto } from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanInQuery } from '../../common/validators';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../common/role';
import { UserProfileDto } from './user-profile.dto';

export class GetUsersRequestDto extends PaginateUserRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Role)
  readonly role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanInQuery()
  readonly withoutRole?: boolean;
}

export enum GetUsersError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
  INVALID_CITY = 'INVALID_CITY',
  INVALID_DIVISION = 'INVALID_DIVISION',
}

export class GetUsersResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetUsersError })
  error?: GetUsersError;

  @ApiPropertyOptional({ isArray: true, type: UserProfileDto })
  users?: UserProfileDto[];
}
