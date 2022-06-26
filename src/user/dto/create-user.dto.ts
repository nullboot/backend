import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';
import { Role } from '../../common/role';
import {
  ArrayUnique,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { IsUsername } from '../../common/validators';

export class CreateUserRequestDto {
  /**
   * 用户名
   */
  @ApiProperty()
  @IsUsername()
  readonly username: string;

  /**
   * 真实姓名
   */
  @ApiProperty()
  @IsString()
  @Length(0, 24)
  readonly realname: string;

  /**
   * 邮箱
   */
  @ApiProperty()
  @IsEmail()
  readonly email: string;

  /**
   * 是否公开邮箱
   */
  @ApiProperty()
  @IsBoolean()
  readonly publicEmail: boolean;

  /**
   * 角色列表
   */
  @ApiProperty({ isArray: true, enum: Role })
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  readonly roles: Role[];

  /**
   * （明文）密码
   */
  @ApiProperty()
  @Length(6, 32)
  @IsString()
  readonly password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  readonly cityId?: number;

  @ApiProperty()
  @IsInt()
  readonly divisionId: number;
}

export enum CreateUserError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_USERNAME = 'DUPLICATE_USERNAME',
  INVALID_CITY = 'INVALID_CITY',
  INVALID_DIVISION = 'INVALID_DIVISION',
}

export class CreateUserResponseDto {
  @ApiPropertyOptional({ enum: CreateUserError })
  error?: CreateUserError;

  @ApiPropertyOptional({ type: UserProfileDto })
  profile?: UserProfileDto;
}
