import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

/**
 * `UserAuthEntity`: 数据库 `user_auth` 表中的实体
 *
 * `password` 为加盐加密后的密码
 */
@Entity('user_auth')
export class UserAuthEntity {
  /**
   * 与 `user` 表的一对一关系，级联删除
   */
  @OneToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: UserEntity;

  /**
   * 关联用户ID
   */
  @PrimaryColumn()
  userId: number;

  /**
   * 加盐加密后的密码
   */
  @Column({ type: 'char', length: 60, nullable: false })
  password: string;
}
