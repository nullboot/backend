import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/role';
import { CityDto, DivisionDto } from '../../tag/dto';

/**
 * 用户 Profile 类型
 */
export class UserProfileDto {
  /**
   * 用户ID
   */
  @ApiProperty()
  id: number;

  /**
   * 用户名
   */
  @ApiProperty()
  username: string;

  /**
   * 真实姓名
   */
  @ApiProperty()
  realname: string;

  /**
   * 邮箱
   */
  @ApiProperty()
  email: string;

  /**
   * 是否公开邮箱
   */
  @ApiProperty()
  publicEmail: boolean;

  /**
   * 是否为根管理员
   */
  @ApiProperty()
  isRoot: boolean;

  /**
   * 注册时间
   */
  @ApiProperty()
  registerTime: Date;

  @ApiProperty({ isArray: true, enum: Role })
  roles: Role[];

  @ApiProperty({ type: CityDto })
  city: CityDto;

  @ApiProperty({ type: DivisionDto })
  division: DivisionDto;
}
