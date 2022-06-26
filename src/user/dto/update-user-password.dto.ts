import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

/**
 * `POST user/password` 请求
 *
 * `oldPassword` 为根管理员的可选项，其他角色用户必填
 */
export class UpdatePasswordRequestDto {
  /**
   * 旧密码（仅对根管理员为可选）
   */
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly oldPassword?: string;

  /**
   * 新密码
   */
  @ApiProperty()
  @Length(6, 32)
  @IsString()
  readonly password: string;
}

export enum UpdatePasswordError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_USER = 'NO_SUCH_USER',
  WRONG_OLD_PASSWORD = 'WRONG_OLD_PASSWORD',
}

export class UpdatePasswordResponseDto {
  @ApiPropertyOptional({ enum: UpdatePasswordError })
  error?: UpdatePasswordError;
}
