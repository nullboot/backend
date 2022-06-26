import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConfigService } from '../config/config.service';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

import {
  PostError,
  LoginError,
  LoginRequestDto,
  LoginResponseDto,
  LogoutError,
  LogoutRequestDto,
  LogoutResponseDto,
  PostResponseDto,
} from './dto';
import { CurrentUser } from '../common/user.decorator';
import { UserEntity } from '../user/user.entity';

/**
 * `AuthController`: 处理认证相关的请求
 */
@ApiTags('AUTH')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * `postLogin`: 用户登录
   * @param req 请求体：用 `username`, `email` 之一描述要登录的用户
   * @returns 成功：`201: {token, profile}`；失败：`201: {error}`
   */
  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description:
      '使用用户名 `username` 或邮箱 `email` 登录，返回JSON Web Token `token` 和用户信息 `profile`',
  })
  async login(@Body() req: LoginRequestDto): Promise<LoginResponseDto> {
    //if (currentUser) return { error: LoginResponseError.ALREADY_LOGIN };

    const user = req.username
      ? await this.userService.findByUsername(req.username)
      : await this.userService.findByEmail(req.email);
    if (!user) return { error: LoginError.NO_SUCH_USER };

    const userAuth = await this.authService.findByUserId(user.id);
    if (!(await this.authService.checkPassword(userAuth, req.password)))
      return { error: LoginError.WRONG_PASSWORD };

    return {
      token: await this.authService.signJwt(user),
      profile: await this.userService.filterProfile(user, user),
    };
  }

  /**
   * `post`: 用户认证：以 `token` 获取 `profile`
   *
   * @param currentUser 当前用户：存在时直接返回 `profile`
   * @returns 成功：`201: {profile}`；失败：`201: {error}`
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取用户信息',
    description: '已登录的用户获取自己的用户信息 `profile`',
  })
  async post(@CurrentUser() currentUser: UserEntity): Promise<PostResponseDto> {
    if (!currentUser) return { error: PostError.NOT_LOGIN };

    return {
      profile: await this.userService.filterProfile(currentUser, currentUser),
    };
  }

  /**
   * `postLogout`: **假的**用户注销
   *
   * 需要前端在发出请求（或者收到响应后）自行销毁 `token`
   * @param currentUser 当前用户
   * @param req 请求体：需要传一下 `userId` :(
   * @returns 成功：`201: {}`；失败：`201: {error}`
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '用户登出',
    description: '这是一个**假的**API，请务必在前端销毁Token',
  })
  async postLogout(
    @CurrentUser() currentUser: UserEntity,
    @Body() req: LogoutRequestDto,
  ): Promise<LogoutResponseDto> {
    if (!currentUser) return { error: LogoutError.NOT_LOGIN };

    const user = await this.userService.findById(req.userId);
    if (!user) return { error: LogoutError.NO_SUCH_USER };

    if (user.id !== currentUser.id)
      return { error: LogoutError.PERMISSION_DENIED };

    return {};
  }
}
