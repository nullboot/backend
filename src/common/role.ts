import { UserEntity } from '../user/user.entity';

/**
 * 用户角色类型
 */
export enum Role {
  NEWBIE = 'NEWBIE',
  TUTOR = 'TUTOR',
  HRBP = 'HRBP',
  ADMIN = 'ADMIN',
}

/**
 * 判断用户是否具有指定角色
 * @param user
 * @param role
 */
export function hasRole(user: UserEntity, role: Role): boolean {
  return !!user?.roles.includes(role);
}

/**
 * 判断用户是否具有指定角色或为 ROOT
 * @param user
 * @param role
 */
export function hasRoleOrRoot(user: UserEntity, role: Role): boolean {
  return hasRole(user, role) || user?.isRoot;
}
