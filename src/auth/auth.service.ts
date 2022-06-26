import { Injectable } from '@nestjs/common';
import { UserAuthEntity } from './user-auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/user.entity';

/**
 * `AuthService`: 执行 user-auth 相关的书库处理（`token` 签发、数据库操作等）
 */
@Injectable()
export class AuthService {
  /**
   * 构造函数
   * @param userAuthRepository `UserAuthEntity` 的存储库
   * @param jwtService `JsonWebToken` 服务
   */
  constructor(
    @InjectRepository(UserAuthEntity)
    private readonly userAuthRepository: Repository<UserAuthEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 根据 `userId` 查找用户认证
   * @param userId 用户ID
   */
  async findByUserId(userId: number): Promise<UserAuthEntity> {
    return await this.userAuthRepository.findOne({ userId });
  }

  /**
   * 为 `user` 签发包含 `userId` 的 Json Web Token
   * @param user 用户实体
   * @returns `token`
   */
  async signJwt(user: UserEntity): Promise<string> {
    const payLoad = { sub: user.id };
    return this.jwtService.sign(payLoad);
  }

  /**
   * 对 `password` 进行单向加盐加密
   * @param password 明文密码
   * @private
   * @returns 含盐的加密密码
   */
  private static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * 检验 `password` 能否通过 `userAuth` 的认证
   * @param userAuth 用户认证实体
   * @param password 待验证明文密码
   */
  async checkPassword(
    userAuth: UserAuthEntity,
    password: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, userAuth.password);
  }

  /**
   * 覆盖 `userAuth` 中的密码；**没有鉴权，直接覆盖**
   * @param userAuth 用户认证实体
   * @param password （新）明文密码
   */
  async changePassword(
    userAuth: UserAuthEntity,
    password: string,
  ): Promise<void> {
    userAuth.password = await AuthService.hashPassword(password);
    await this.userAuthRepository.save(userAuth);
  }

  async create(userId: number, password: string): Promise<UserAuthEntity> {
    let userAuth = this.userAuthRepository.create({
      userId,
      password: await AuthService.hashPassword(password),
    });
    userAuth = await this.userAuthRepository.save(userAuth);
    return userAuth;
  }
}
