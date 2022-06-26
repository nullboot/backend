import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class LogoutRequestDto {
  @ApiProperty({ description: '用户Id' })
  @IsInt()
  readonly userId: number;
}

export enum LogoutError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_LOGIN = 'NOT_LOGIN',
  NO_SUCH_USER = 'NO_SUCH_USER',
}

export class LogoutResponseDto {
  @ApiPropertyOptional({ enum: LogoutError, description: '错误码' })
  error?: LogoutError;
}
