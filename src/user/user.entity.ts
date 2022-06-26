import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserAuthEntity } from '../auth/user-auth.entity';

import { Role } from '../common/role';
import { CityEntity } from '../tag/tag-city.entity';
import { DivisionEntity } from '../tag/tag-division.entity';

/**
 * `UserEntity`: 数据库 `user` 表中的实体
 *
 * `username`, `email` 不允许重复；`isRoot` 不应在项目中修改；`roles` 应确保不存在重复项
 *
 * 与 `user-auth` 表有一对一关系
 */
@Entity('user')
export class UserEntity {
  /**
   * 用户ID：为绝大多数用户相关请求中用户的唯一标识符
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 用户名：用于公开展示的名字；不可重复
   */
  @Column({ type: 'varchar', length: 24 })
  @Index({ unique: true })
  username: string;

  /**
   * 真实姓名：用户实体创建后不应随意修改
   */
  @Column({ type: 'varchar', length: 24 })
  @Index()
  realname: string;

  /**
   * 邮箱: 后续**通知**等功能中可能会用到
   */
  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  email: string;

  /**
   * 是否公开邮箱：设置为 `false` 后其他用户无法查看到邮箱（管理员除外）
   */
  @Column({ type: 'boolean', default: false })
  publicEmail: boolean;

  /**
   * 是否为根管理员：只能通过直接操作数据库指定，不应在项目中修改
   */
  @Column({ type: 'boolean', default: false })
  isRoot: boolean;

  /**
   * 注册时间：创建用户时填充
   */
  @Column({ type: 'datetime', nullable: true })
  registerTime: Date;

  /**
   * 角色列表：应为**互不相同**的 `Role` 类型列表
   */
  @Column({ type: 'json' })
  roles: Role[];

  /**
   * 与 `user-auth` 表的一对一关系
   */
  @OneToOne(() => UserAuthEntity, (userAuth) => userAuth.user)
  userAuth: UserAuthEntity;

  @ManyToOne(() => CityEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'cityId' })
  city?: CityEntity;

  @Column({ nullable: true })
  @Index()
  cityId?: number;

  @ManyToOne(() => DivisionEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'divisionId' })
  division?: DivisionEntity;

  @Column({ nullable: true })
  @Index()
  divisionId?: number;
}
