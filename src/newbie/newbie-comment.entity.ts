import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NewbieEntity } from './newbie.entity';

/**
 * 评语类型
 */
export enum NewbieCommentType {
  // noinspection JSUnusedGlobalSymbols
  NewbieToTutor = 'NewbieToTutor', // 新人对导师的评价
  TutorToNewbie = 'TutorToNewbie', // 导师对新人的评价
  TutorRecord = 'TutorRecord', // 导师带新记录
}

/**
 * `NewbieCommentEntity`: 数据库 newbie_comment 表中的实体，描述与新人相关的各种评语信息
 */
@Entity('newbie_comment')
export class NewbieCommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 与 newbie 的多对一外键关联
   */
  @ManyToOne(() => NewbieEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'newbieId' })
  newbie: NewbieEntity;

  /**
   * 新人ID
   */
  @Column()
  @Index()
  newbieId: number;

  /**
   * 评语类型
   */
  @Column({ type: 'enum', enum: NewbieCommentType })
  @Index()
  type: NewbieCommentType;

  /**
   * 评语内容
   */
  @Column({ type: 'mediumtext' })
  content: string;

  /**
   * 打分
   */
  @Column({ type: 'integer', nullable: true })
  score: number;

  /**
   * 更新时间
   */
  @UpdateDateColumn()
  updateTime: Date;
}
