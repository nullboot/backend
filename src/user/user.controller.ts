import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { UserEntity } from './user.entity';

import {
  CreateUserError,
  CreateUserRequestDto,
  CreateUserResponseDto,
  GetUserProfileError,
  GetUserProfileResponseDto,
  GetUsersError,
  GetUsersRequestDto,
  GetUsersResponseDto,
  UpdatePasswordError,
  UpdatePasswordRequestDto,
  UpdatePasswordResponseDto,
  UpdateUserProfileError,
  UpdateUserProfileRequestDto,
  UpdateUserProfileResponseDto,
  UpdateUserRolesError,
  UpdateUserRolesRequestDto,
  UpdateUserRolesResponseDto,
} from './dto';
import { CurrentUser } from '../common/user.decorator';
import { IntParam } from '../common/validators';
import { hasRole, Role } from '../common/role';
import { PermissionService } from '../permission/permission.service';
import { DivisionService } from '../tag/tag-division.service';
import { CityService } from '../tag/tag-city.service';
import { WildcardType } from '../common/dto';

/**
 * `UserController`: 处理 user 相关的 API 请求
 */
@ApiTags('USER')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly divisionService: DivisionService,
    private readonly cityService: CityService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * 获取用户的 `Profile`
   * @param currentUser 当前用户
   * @param id 用户Id：标识查询的用户
   * @returns 成功：`200: {profile, roles}`；失败：`200: {error}`
   */
  @Get(':id/profile')
  @ApiOperation({
    summary: 'Get user profile.',
    description: 'Identify user by {id} in path.',
  })
  async getUserProfile(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
  ): Promise<GetUserProfileResponseDto> {
    // validate permission
    if (!currentUser) return { error: GetUserProfileError.PERMISSION_DENIED };

    const user = await this.userService.findById(id);
    if (!user) return { error: GetUserProfileError.NO_SUCH_USER };

    return { profile: await this.userService.filterProfile(user, currentUser) };
  }

  /**
   * 修改用户的 `Profile`，覆盖式更新 `username`, `realname`, `email`, `publicEmail`
   * @param currentUser 当前用户：只有 `ROOT` 可以修改其他用户的 `Profile`
   * @param id 用户Id：标识被需改用户
   * @param body 请求体：需完整提供 `username`, `realname`, `email`, `publicEmail`
   * @returns 成功：`201: {}`；失败：`201: {error}`
   */
  @Post(':id/profile')
  @ApiOperation({
    summary: 'Update user profile.',
    description:
      'Identify user by {id} in path. ' +
      'Require {username, realname, email, publicEmail, cityId, divisionId}. ' +
      "Only ROOT can change other's profile." +
      'Only ROOT can change {realname, cityId, divisionId}',
  })
  async updateUserProfile(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: UpdateUserProfileRequestDto,
  ): Promise<UpdateUserProfileResponseDto> {
    // validate permission
    if (!currentUser)
      return { error: UpdateUserProfileError.PERMISSION_DENIED };
    const user = await this.userService.findById(id);
    if (!user) return { error: UpdateUserProfileError.NO_SUCH_USER };

    // Only ROOT can change other's profile;
    // Only ROOT can change realname, city and division.
    if (
      !currentUser.isRoot &&
      (user.id !== currentUser.id ||
        (body.realname != null && body.realname !== user.realname) ||
        (body.cityId != null && body.cityId !== user.cityId) ||
        (body.divisionId != null && body.divisionId !== user.divisionId))
    )
      return { error: UpdateUserProfileError.PERMISSION_DENIED };

    // validate tags
    if (body.cityId != null && !(await this.cityService.validate(body.cityId)))
      return { error: UpdateUserProfileError.INVALID_CITY };
    if (
      body.divisionId != null &&
      !(await this.divisionService.validate(body.divisionId))
    )
      return { error: UpdateUserProfileError.INVALID_DIVISION };

    // change profile
    const [error, newUser] = await this.userService.updateProfile(user, body);
    if (error) return { error };

    return {
      profile: await this.userService.filterProfile(newUser, currentUser),
    };
  }

  /**
   * 修改密码
   * @param currentUser 当前用户：只有 `ROOT` 能够修改其他用户的密码，且无需验证旧密码
   * @param id 用户Id：标识被修改用户
   * @param body 请求体：`password`, `oldPassword` 分别为新旧密码
   * @returns 成功：`201: {}`；失败：`201: {error}`
   */
  @Post(':id/password')
  @ApiOperation({
    summary: 'Update user password.',
    description:
      'Identify user by {id} in path. ' +
      'Require {oldPassword} (OPTIONAL for ROOT) and {password}. ' +
      "Only ROOT can change other's password (even without checking old password).",
  })
  async updateUserPassword(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: UpdatePasswordRequestDto,
  ): Promise<UpdatePasswordResponseDto> {
    // validate permission
    if (!currentUser) return { error: UpdatePasswordError.PERMISSION_DENIED };
    const user = await this.userService.findById(id);
    if (!user) return { error: UpdatePasswordError.NO_SUCH_USER };
    if (
      (currentUser.id !== user.id || body.oldPassword == null) &&
      !currentUser.isRoot
    )
      return { error: UpdatePasswordError.PERMISSION_DENIED };

    // check oldPassword
    const userAuth = await this.authService.findByUserId(user.id);
    // Only ROOT can change other's password (even without checking old password)
    if (
      !currentUser.isRoot &&
      !(await this.authService.checkPassword(userAuth, body.oldPassword))
    )
      return { error: UpdatePasswordError.WRONG_OLD_PASSWORD };

    // change password
    await this.authService.changePassword(userAuth, body.password);

    return {};
  }

  @ApiTags('ROOT')
  @Post(':id/roles')
  @ApiOperation({ summary: '[ROOT] Update user roles.' })
  async updateUserRoles(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: UpdateUserRolesRequestDto,
  ): Promise<UpdateUserRolesResponseDto> {
    // validate permission
    if (!currentUser?.isRoot)
      return { error: UpdateUserRolesError.PERMISSION_DENIED };

    const user = await this.userService.findById(id);
    if (!user) return { error: UpdateUserRolesError.NO_SUCH_USER };

    await this.userService.updateRoles(user, body.roles);

    return {
      profile: await this.userService.getProfileById(id, currentUser),
    };
  }

  @ApiTags('ROOT')
  @Post('new')
  @ApiOperation({ summary: '[ROOT] Create new user.' })
  async createUser(
    @CurrentUser() currentUser: UserEntity,
    @Body() body: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    // validate permission
    if (!currentUser?.isRoot)
      return { error: CreateUserError.PERMISSION_DENIED };

    // validate username & email
    if (!(await this.userService.validateUsername(body.username)))
      return { error: CreateUserError.DUPLICATE_USERNAME };
    if (!(await this.userService.validateEmail(body.email)))
      return { error: CreateUserError.DUPLICATE_EMAIL };

    // validate tags
    if (!(await this.cityService.validate(body.cityId)))
      return { error: CreateUserError.INVALID_CITY };
    if (!(await this.divisionService.validate(body.divisionId)))
      return { error: CreateUserError.INVALID_DIVISION };

    const user = await this.userService.create(body);
    await this.authService.create(user.id, body.password);

    return {
      profile: await this.userService.filterProfile(user, currentUser),
    };
  }

  @ApiTags('LIST')
  @Get('')
  @ApiOperation({ summary: 'Get user list.' })
  async getUsers(
    @CurrentUser() currentUser: UserEntity,
    @Query() query: GetUsersRequestDto,
  ): Promise<GetUsersResponseDto> {
    // validate permission
    function hasPermission(): boolean {
      const currentRole = query.currentRole;
      if (!currentUser) return false;
      if (currentUser.isRoot) return true;
      if (!hasRole(currentUser, currentRole)) return false;
      return [Role.HRBP, Role.ADMIN].includes(currentRole);
    }

    if (!hasPermission()) return { error: GetUsersError.PERMISSION_DENIED };

    // validate query
    if (query.take > 100) return { error: GetUsersError.TAKE_TOO_MANY };
    const divisionIds = await this.permissionService.filterPermissions(
      currentUser,
      query.currentRole,
      await this.divisionService.findById(query.divisionId),
    );
    if (query.divisionId && (divisionIds == null || divisionIds.length === 0))
      return { error: GetUsersError.INVALID_DIVISION };
    if (query.cityId && !(await this.cityService.validate(query.cityId)))
      return { error: GetUsersError.INVALID_CITY };

    // get data
    const [list, count] = await this.userService.getList(
      query.skip,
      query.take,
      {
        cityId: query.cityId,
        divisionIds: divisionIds,
        searchRealname: query.keyword
          ? {
              keyword: query.keyword,
              wildcard: query.wildcard || WildcardType.END,
            }
          : undefined,
        filterByRole: query.role
          ? { role: query.role, without: query.withoutRole }
          : undefined,
      },
    );

    return {
      users: await Promise.all(
        list.map((entity) =>
          this.userService.filterProfile(entity, currentUser),
        ),
      ),
      count,
    };
  }
}
