import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import { DivisionEntity } from '../tag/tag-division.entity';

@Entity('permission')
export class PermissionEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @PrimaryColumn()
  userId: number;

  @PrimaryColumn({ type: 'enum', enum: [Role.ADMIN, Role.HRBP] })
  role: Role;

  @ManyToOne(() => DivisionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'divisionId' })
  division: DivisionEntity;

  @PrimaryColumn()
  divisionId: number;
}
