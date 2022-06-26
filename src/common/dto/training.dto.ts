import { ApiProperty } from '@nestjs/swagger';

/**
 * 培训项
 */
abstract class TrainingItemDto {
  /**
   * 培训项ID
   */
  @ApiProperty({ description: '培训项Id' })
  id: number;

  /**
   * 建议学习时间
   */
  @ApiProperty({ description: '建议学习日期' })
  day: number;

  /**
   * 标签
   */
  @ApiProperty({ description: '标签列表' })
  tags: string[];

  @ApiProperty({ description: '是否完成' })
  finished: boolean;
}

export class TrainingExamDto extends TrainingItemDto {
  @ApiProperty({ description: '得分' })
  score: number;
}

export class TrainingTaskDto extends TrainingItemDto {}

export class TrainingSectionDto {
  @ApiProperty({ description: '章节Id' })
  id: number;

  @ApiProperty({ description: '是否完成' })
  finished: boolean;
}

export class TrainingCourseDto extends TrainingItemDto {
  @ApiProperty({ description: '是否选修' })
  isOptional: boolean;

  @ApiProperty({
    type: TrainingSectionDto,
    isArray: true,
    description: '章节列表',
  })
  sections: TrainingSectionDto[];
}

export class TrainingDto {
  @ApiProperty({
    type: TrainingExamDto,
    isArray: true,
    description: '考试列表',
  })
  exams: TrainingExamDto[];

  @ApiProperty({
    type: TrainingTaskDto,
    isArray: true,
    description: '任务列表',
  })
  tasks: TrainingTaskDto[];

  @ApiProperty({
    type: TrainingCourseDto,
    isArray: true,
    description: '课程列表',
  })
  courses: TrainingCourseDto[];
}
