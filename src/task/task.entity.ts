import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContentEntity } from '../common/types';
import { UserEntity } from '../user/user.entity';

/**
 * `TaskEntity`: 数据库 task 表中的实体
 */
@Entity('task')
export class TaskEntity extends ContentEntity {
  /**
   * 是否已被使用
   *
   * 被使用后不能删除
   */
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'json' })
  tags: string[];

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner?: UserEntity;

  @Column({ type: 'int', nullable: true })
  @Index()
  ownerId?: number;
}
