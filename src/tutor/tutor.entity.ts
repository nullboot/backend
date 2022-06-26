import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { TraineeEntity } from '../common/types';
import { UserEntity } from '../user/user.entity';

/**
 * `TutorEntity`: 数据库 tutor 表中的实体
 */
@Entity('tutor')
export class TutorEntity extends TraineeEntity {
  /**
   * 与 user 表的一对一外键关联，级联删除
   */
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  /**
   * 用户ID
   */
  @PrimaryColumn()
  @Index()
  userId: number;

  /**
   * 是否被 HRBP 审核通过
   *
   * true: 已通过; false: 未通过; null: 未审核
   */
  @Column({ type: 'boolean', nullable: true, default: null })
  @Index()
  isApproved: boolean;

  /**
   * 审核通过时间
   */
  @Column({ type: 'datetime', nullable: true })
  approvedTime: Date;

  /**
   * 提名时间
   */
  @Column({ type: 'datetime', nullable: true })
  nominateTime: Date;

  /**
   * 导师评分总分
   */
  @Column({ type: 'integer', default: 0 })
  @Index()
  totalScore: number;

  /**
   * 导师评分平均分(百分制)
   */
  @Column({ type: 'integer', default: 0 })
  @Index()
  averageScore: number;

  /**
   * 已毕业新人数
   */
  @Column({ type: 'integer', default: 0 })
  graduateNewbieCount: number;

  /**
   * 总新人数
   */
  @Column({ type: 'integer', default: 0 })
  totalNewbieCount: number;
}
