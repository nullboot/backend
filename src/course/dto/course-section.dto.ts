import { ApiProperty } from '@nestjs/swagger';
import { CourseSectionType } from '../course-section.entity';
import { IsEnum, IsInt, IsString, Length } from 'class-validator';
import { FileInfoDto } from '../../file/dto';

export class CourseSectionDto {
  @ApiProperty({ description: '课程章节Id' })
  id: number;

  @ApiProperty({ description: '标题' })
  title: string;

  @ApiProperty({ description: '详情' })
  description: string;

  @ApiProperty({ enum: CourseSectionType, description: '类型（视频|课件）' })
  type: CourseSectionType;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ type: FileInfoDto, description: '文件信息' })
  fileInfo: FileInfoDto;

  @ApiProperty({ description: '是否被使用' })
  isUsed: boolean;
}

export class CourseSectionRequestDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  @Length(1, 80)
  title: string;

  @ApiProperty({ description: '详情' })
  @IsString()
  description: string;

  @ApiProperty({ enum: CourseSectionType, description: '类型（视频|课件）' })
  @IsEnum(CourseSectionType)
  type: CourseSectionType;

  @ApiProperty({ description: '文件名' })
  @IsString()
  @Length(1, 255)
  filename: string;

  @ApiProperty({ description: '文件Id' })
  @IsInt()
  fileId: number;
}

export class CourseSectionForTraineeDto {
  @ApiProperty({ description: '标题' })
  title: string;

  @ApiProperty({ description: '详情' })
  description: string;

  @ApiProperty({ enum: CourseSectionType, description: '类型（视频|课件）' })
  type: CourseSectionType;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ description: '下载链接' })
  downloadLink: string;

  @ApiProperty({ description: '是否完成' })
  finished: boolean;
}
