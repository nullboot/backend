import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { PermissionEntity } from './permission.entity';
import { Connection, Repository } from 'typeorm';
import { Role } from '../common/role';
import { UserEntity } from '../user/user.entity';
import { DivisionEntity } from '../tag/tag-division.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Get all permissions of an Admin or Hrbp
   * @param user
   * @param role
   */
  async getPermissions(
    user: UserEntity,
    role: Role,
  ): Promise<DivisionEntity[]> {
    const query = this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoinAndSelect('permission.division', 'division')
      .where('permission.userId = :userId', { userId: user.id })
      .andWhere('permission.role = :role', { role });
    return (await query.getMany()).map((permission) => permission.division);
  }

  /**
   * Filter the permissions of Admin or Hrbp or Root
   * @param user
   * @param role
   * @param filterTag
   * @returns `null` if having all permissions
   * @returns filtered permissions otherwise
   */
  async filterPermissions(
    user: UserEntity,
    role: Role,
    filterTag?: DivisionEntity,
  ): Promise<number[]> {
    if (user.isRoot) return filterTag ? [filterTag.id] : null;
    const permissions = await this.getPermissions(user, role);
    if (filterTag)
      return permissions.some((permission) => permission.id === filterTag.id)
        ? [filterTag.id]
        : [];
    return permissions.map((permission) => permission.id);
  }

  async setPermissions(
    user: UserEntity,
    role: Role,
    divisionIds: number[],
  ): Promise<void> {
    await this.connection.transaction('READ COMMITTED', async (manager) => {
      await manager.delete(PermissionEntity, { userId: user.id, role });

      await Promise.all(
        divisionIds.map((divisionId) => {
          manager.insert(PermissionEntity, {
            userId: user.id,
            role,
            divisionId,
          });
        }),
      );
    });
  }

  async hasPermission(
    user: UserEntity,
    role: Role,
    divisionId: number,
  ): Promise<boolean> {
    if (!user) return false;
    if (user.isRoot) return true;
    if (role) {
      if (!user.roles.includes(role)) return false;
      return (
        (await this.permissionRepository.count({
          userId: user.id,
          role,
          divisionId,
        })) > 0
      );
    }
    if (!user.roles.includes(Role.HRBP) && !user.roles.includes(Role.ADMIN))
      return false;
    return (
      (await this.permissionRepository.count({ userId: user.id, divisionId })) >
      0
    );
  }
}
