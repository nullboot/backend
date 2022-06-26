import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContentEntity } from '../common/types';
import { UserEntity } from '../user/user.entity';

/**
 * `CourseEntity`: 数据库 course 表中的实体
 */
@Entity('course')
export class CourseEntity extends ContentEntity {
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

  @Column({ type: 'json' })
  sectionIds: number[];
}
