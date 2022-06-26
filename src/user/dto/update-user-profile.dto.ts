import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { IsUsername } from '../../common/validators';
import { UserProfileDto } from './user-profile.dto';

/**
 * `POST user/profile` 请求
 *
 * 这是一个**覆盖**式的更新请求，若不修改某些项，也需填充原值
 */
export class UpdateUserProfileRequestDto {
  /**
   * 用户名
   */
  @ApiProperty()
  @IsOptional()
  @IsUsername()
  readonly username?: string;

  /**
   * 邮箱
   */
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  /**
   * 是否公开邮箱
   */
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly publicEmail?: boolean;

  /**
   * 仅对 ROOT 可用：真实姓名
   *
   * 其余用户提供此项时，会返回 PERMISSION_DENIED
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(0, 24)
  readonly realname?: string;

  /**
   * 仅对 ROOT 可用：部门标签
   *
   * 其余用户提供此项时，会返回 PERMISSION_DENIED
   */
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly divisionId?: number;

  /**
   * 仅对 ROOT 可用：城市标签
   *
   * 其余用户提供此项时，会返回 PERMISSION_DENIED
   */
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly cityId?: number;
}

export enum UpdateUserProfileError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_USERNAME = 'DUPLICATE_USERNAME',
  INVALID_CITY = 'INVALID_CITY',
  INVALID_DIVISION = 'INVALID_DIVISION',
}

export class UpdateUserProfileResponseDto {
  @ApiPropertyOptional({ enum: UpdateUserProfileError })
  error?: UpdateUserProfileError;

  @ApiPropertyOptional({ type: UserProfileDto })
  profile?: UserProfileDto;
}
