import { IsIn, IsIP, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPortNumber } from '../common/validators';

/**
 * 服务端配置
 */
class ServerConfig {
  /**
   * 主机名：应用监听的 IP地址
   *
   * 例如：`0.0.0.0`
   */
  @IsIP()
  readonly hostname: string;

  /**
   * 端口号：应用监听的端口号
   */
  @IsPortNumber()
  readonly port: number;
}

/**
 * 数据库服务配置
 */
class ServicesConfigDatabase {
  /**
   * 数据库类型：可选 `mysql`, `mariadb`
   */
  @IsIn(['mysql', 'mariadb'])
  readonly type: 'mysql' | 'mariadb';

  /**
   * 数据库主机
   */
  @IsString()
  readonly host: string;

  /**
   * 数据库端口号
   */
  @IsPortNumber()
  readonly port: number;

  /**
   * 数据库用户名
   */
  @IsString()
  readonly username: string;

  /**
   * 数据库密码
   */
  @IsString()
  readonly password: string;

  /**
   * 数据库名
   */
  @IsString()
  readonly database: string;
}

/**
 * MinIO（文件存储）服务配置
 */
class ServicesConfigMinio {
  /**
   * 服务端端点
   */
  @IsUrl({ required_tld: false })
  readonly endpoint: string;

  /**
   * 客户端端点
   */
  @IsUrl({ required_tld: false })
  readonly userEndpoint: string;

  /**
   * 连接用户名
   */
  @IsString()
  readonly accessKey: string;

  /**
   * 连接密码
   */
  @IsString()
  readonly secretKey: string;

  /**
   * 存储桶名
   */
  @IsString()
  readonly bucket: string;
}

/**
 * 服务配置
 */
class ServicesConfig {
  /**
   * 数据库服务配置
   */
  @ValidateNested()
  @Type(() => ServicesConfigDatabase)
  readonly database: ServicesConfigDatabase;

  /**
   * MinIO（文件存储）服务配置
   */
  @ValidateNested()
  @Type(() => ServicesConfigMinio)
  readonly minio: ServicesConfigMinio;
}

/**
 * 安全配置
 */
class SecurityConfig {
  /**
   * Json Web Token 密钥
   */
  @IsString()
  readonly jwtSecret: string;
}

/**
 * 应用配置
 */
export class AppConfig {
  /**
   * 服务端配置
   */
  @ValidateNested()
  @Type(() => ServerConfig)
  readonly server: ServerConfig;

  /**
   * 服务配置
   */
  @ValidateNested()
  @Type(() => ServicesConfig)
  readonly services: ServicesConfig;

  /**
   * 安全配置
   */
  @ValidateNested()
  @Type(() => SecurityConfig)
  readonly security: SecurityConfig;
}
