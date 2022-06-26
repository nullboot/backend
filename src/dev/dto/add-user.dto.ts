import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

/**
 * [DEV] `POST dev/addUser` 请求
 */
export class addUserRequestDto {
  @ApiProperty({ description: '用户Id', example: '1' })
  @IsInt()
  id: number;

  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ description: '真实姓名', example: 'admin' })
  @IsOptional()
  @IsString()
  realname: string;

  @ApiProperty({ description: '邮箱', example: 'admin@null.boot' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: '是否公开邮箱', example: 'true' })
  @IsBoolean()
  publicEmail: boolean;

  @ApiPropertyOptional({ description: '是否为根管理员', example: 'false' })
  @IsBoolean()
  isRoot: boolean;

  @ApiProperty({ description: '密码（明文）', example: '123456' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '部门Id', example: '1' })
  @IsOptional()
  @IsInt()
  divisionId: number;

  @ApiPropertyOptional({ description: '城市Id', example: '1' })
  @IsOptional()
  @IsInt()
  cityId: number;
}

export class addUserResponseDto {
  @ApiPropertyOptional({ description: '用户信息' })
  profile?: UserProfileDto;

  @ApiPropertyOptional({ description: '明文密码' })
  password?: string;

  @ApiPropertyOptional({ description: '错误信息' })
  error?: string;
}
