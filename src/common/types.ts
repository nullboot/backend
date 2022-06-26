import { Column, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { TrainingDto } from './dto';

/**
 * 通用内容实体
 */
export abstract class ContentEntity {
  /**
   * 主键：内容ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 标题
   */
  @Column({ type: 'varchar', length: 80 })
  title: string;

  /**
   * 描述
   */
  @Column({ type: 'mediumtext' })
  description: string;
}

/**
 * 培训参与者实体
 */
export abstract class TraineeEntity {
  @Column({ type: 'json', nullable: true, select: false })
  /**
   * 是否存在（删除标记）
   *
   * **约定**：重新创建时，不清除其他字段
   */
  @Column({ type: 'boolean', nullable: false, default: true })
  @Index()
  isExist: boolean;

  /**
   * 培训对象
   */
  @Column({ type: 'json', nullable: true, select: false })
  training: TrainingDto;

  /**
   * 完成培训（新人毕业；导师上岗）
   */
  @Column({ type: 'boolean', default: false })
  @Index()
  isGraduate: boolean;

  /**
   * 完成培训时间
   */
  @Column({ type: 'datetime', nullable: true })
  graduationTime: Date;
}

export enum DefaultError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export enum DefaultPaginateError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
}

export abstract class TimeRange {
  @ApiPropertyOptional({ type: 'datetime', nullable: false })
  startTime: Date;

  @ApiPropertyOptional({ type: 'datetime', nullable: false })
  endTime: Date;
}

export class arrayData {
  @ApiPropertyOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ isArray: true })
  data: number[] = [];
}

export class numberData {
  @ApiPropertyOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  data: number;
}
