import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { ContentEntity } from '../common/types';
import { FileEntity } from '../file/file.entity';

/**
 * 课程章节类型
 */
export enum CourseSectionType {
  // noinspection JSUnusedGlobalSymbols
  VIDEO = 'video',
  SLIDES = 'slides',
}

/**
 * `CourseSectionEntity`: 数据库 course_section 表中的实体，为课程中的章节
 */
@Entity('course_section')
export class CourseSectionEntity extends ContentEntity {
  /**
   * 是否已被使用
   *
   * 被使用后不能删除
   */
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  /**
   * `type`: 章节类型
   */
  @Column({ type: 'enum', enum: CourseSectionType })
  @Index()
  type: CourseSectionType;

  /**
   * 与 file 表的一对一外键关联，级联删除
   */
  @OneToOne(() => FileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: FileEntity;

  /**
   * 文件ID
   */
  @Column()
  @Index()
  fileId: number;

  /**
   * 文件名
   */
  @Column({ type: 'varchar', length: 256 })
  filename: string;
}
