import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';

/**
 * 绑定了当前用户的请求
 */
interface RequestWithUser extends Request {
  /**
   * 当前用户实体
   */
  user: UserEntity;
}

/**
 * `@CurrentUser` 注解：从请求中提取出当前用户
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req: RequestWithUser = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
