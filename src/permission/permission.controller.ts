import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IntParam } from '../common/validators';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { hasRole, Role } from '../common/role';
import { CurrentUser } from '../common/user.decorator';
import {
  GetPermissionError,
  GetPermissionResponseDto,
  SetPermissionError,
  SetPermissionRequestDto,
  SetPermissionResponseDto,
} from './dto';
import { PermissionService } from './permission.service';
import { DivisionService } from '../tag/tag-division.service';

@ApiBearerAuth()
@Controller('')
@UseGuards(AuthGuard('jwt'))
export class PermissionController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
    private readonly divisionService: DivisionService,
  ) {}

  @ApiTags('ROLE::Admin', 'ROLE::Hrbp', 'ROOT')
  @Get(':role/:id/permission')
  @ApiParam({ name: 'role', enum: [Role.HRBP, Role.ADMIN] })
  @ApiOperation({
    summary: '[ADMIN|HRBP|ROOT] 获取权限列表',
    description:
      '获取指定用户的指定角色的权限列表；只有 ROOT, HRBP, ADMIN 能使用此功能；HRBP, ADMIN 只能获取自己的权限列表',
  })
  async getPermission(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Param('role') role: Role,
  ): Promise<GetPermissionResponseDto> {
    if (!currentUser) return { error: GetPermissionError.PERMISSION_DENIED };
    const user = await this.userService.findById(id);
    if (user?.id !== currentUser.id && !currentUser.isRoot)
      return { error: GetPermissionError.PERMISSION_DENIED };
    if (!hasRole(user, role))
      return {
        error:
          role === Role.ADMIN
            ? GetPermissionError.NO_SUCH_ADMIN
            : GetPermissionError.NO_SUCH_HRBP,
      };

    const list = await this.permissionService.getPermissions(user, role);

    return { divisions: list.map(DivisionService.toDto) };
  }

  @ApiTags('ROOT')
  @Post(':role/:id/permission')
  @ApiParam({ name: 'role', enum: [Role.HRBP, Role.ADMIN] })
  @ApiOperation({
    summary: '[ROOT] 设置权限列表',
    description: '只有 ROOT 能够使用此功能',
  })
  async setPermission(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Param('role') role: Role,
    @Body() req: SetPermissionRequestDto,
  ): Promise<SetPermissionResponseDto> {
    if (!currentUser?.isRoot)
      return { error: SetPermissionError.PERMISSION_DENIED };
    const user = await this.userService.findById(id);
    if (!hasRole(user, role))
      return {
        error:
          role === Role.ADMIN
            ? SetPermissionError.NO_SUCH_ADMIN
            : SetPermissionError.NO_SUCH_HRBP,
      };
    if (!(await this.divisionService.checkExistenceByIds(req.divisionIds)))
      return { error: SetPermissionError.INVALID_DIVISION };

    await this.permissionService.setPermissions(user, role, req.divisionIds);

    return {};
  }
}
