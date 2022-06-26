import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { NewbieCommentType } from '../newbie-comment.entity';

export class NewbieCommentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  score: number;

  @ApiProperty({ type: Date })
  updateTime: Date;
}

export class NewbieCommentRequestDto {
  @ApiProperty()
  @IsString()
  content: string;

  /**
   * 打分，带新记录中无需传入
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  score?: number;

  @ApiProperty()
  @IsEnum(NewbieCommentType)
  type: NewbieCommentType;

  /**
   * 导师带新纪录Id，填写时表示更新，否则表示新增
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  recordId?: number;
}
