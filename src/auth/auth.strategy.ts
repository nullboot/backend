import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../config/config.service';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';

/**
 * `AuthStrategy`: 认证策略，从请求中认证并提取出当前用户
 */
@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数，注册认证策略
   * @param configService 配置服务
   * @param userService 用户服务
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.config.security.jwtSecret,
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * 从 Json Web Token 解密得到的 `payLoad` 中提取当前用户
   * @param payLoad
   * @returns 当前用户实体
   */
  async validate(payLoad): Promise<UserEntity> {
    return await this.userService.findById(payLoad.sub);
  }
}
