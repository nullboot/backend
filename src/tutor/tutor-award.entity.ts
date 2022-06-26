import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TutorEntity } from './tutor.entity';

/**
 * `TutorAwardEntity`: 数据库 tutor_award 表中的实体，描述导师获得的荣誉
 */
@Entity('tutor_award')
export class TutorAwardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 与 tutor 的多对一外键关联
   */
  @ManyToOne(() => TutorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutorId' })
  tutor: TutorEntity;

  /**
   * tutor 的 ID
   */
  @Column()
  @Index()
  tutorId: number;

  /**
   * 荣誉标题
   */
  @Column({ type: 'text' })
  title: string;

  /**
   * 荣誉内容
   */
  @Column({ type: 'mediumtext', nullable: true })
  description: string;

  /**
   * 荣誉等级
   */
  @Column({ type: 'integer' })
  level: number;

  /**
   * 获得荣誉的时间
   */
  @UpdateDateColumn()
  achieveTime: Date;
}
