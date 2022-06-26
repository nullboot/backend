import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserProfileDto } from '../../user/dto';

/**
 * `username`, `email` 二选一用于标识用户
 */
export class LoginRequestDto {
  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly username?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  readonly password: string;
}

export enum LoginError {
  // ALREADY_LOGIN = 'ALREADY_LOGIN',
  NO_SUCH_USER = 'NO_SUCH_USER',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
}

export class LoginResponseDto {
  @ApiPropertyOptional({ enum: LoginError, description: '错误信息' })
  error?: LoginError;

  @ApiPropertyOptional({ description: 'JSON Web Token' })
  token?: string;

  @ApiPropertyOptional({ description: '用户信息' })
  profile?: UserProfileDto;
}
