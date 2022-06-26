import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { TutorEntity } from '../tutor/tutor.entity';
import { TraineeEntity } from '../common/types';
import { UserEntity } from '../user/user.entity';

/**
 * `NewbieEntity`: 数据库 newbie 表中的实体
 */
@Entity('newbie')
export class NewbieEntity extends TraineeEntity {
  /**
   * 与 user 表的一对一外键关联
   */
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  /**
   * 主键：用户ID
   */
  @PrimaryColumn()
  @Index()
  userId: number;

  /**
   * 与 tutor 表的多对一外键关联，导师被删除时置为 null
   */
  @ManyToOne(() => TutorEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'tutorId' })
  tutor?: TutorEntity;

  /**
   * 导师ID，导师被删除时置为 null
   */
  @Column({ nullable: true })
  @Index()
  tutorId?: number;

  /**
   * 是否入职
   */
  @Column({ type: 'boolean', default: false })
  @Index()
  onBoarding: boolean;

  /**
   * 是否已被导师分配了培训
   */
  @Column({ type: 'boolean', default: false })
  isAssigned: boolean;

  @Column({ type: 'datetime', nullable: true })
  assignedTime: Date;

  /**
   * 考试平均得分
   */
  @Column({ default: 0 })
  examAverageScore: number;
}
