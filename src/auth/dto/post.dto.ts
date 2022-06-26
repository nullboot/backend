import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';

export enum PostError {
  NOT_LOGIN = 'NOT_LOGIN',
}

export class PostResponseDto {
  @ApiPropertyOptional({ enum: PostError, description: '错误信息' })
  error?: PostError;

  @ApiPropertyOptional({ description: '用户信息' })
  profile?: UserProfileDto;
}
