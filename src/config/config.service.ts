import fs from 'fs-extra';

import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

import { AppConfig } from './config.schema';

import yaml from 'js-yaml';

/**
 * `ConfigService`: 读取配置文件，提供配置项查询
 */
export class ConfigService {
  /**
   * 配置对象
   */
  readonly config;

  /**
   * 构造函数
   *
   * 读取环境变量 `CONFIG_FILE` 中指定的 YAML配置文件，并进行类型校验
   */
  constructor() {
    const configFile = process.env.CONFIG_FILE;
    if (!configFile) {
      throw new Error(
        'Please specify configuration file with environment variable CONFIG_FILE',
      );
    }

    const config = yaml.load(fs.readFileSync(configFile).toString());
    this.config = ConfigService.validate(config);
  }

  /**
   * 校验配置对象是否合法
   * @param inputConfig 待校验的配置对象
   * @private
   * @returns 成功时返回 `AppConfig` 对象
   * @throws {Error} 校验失败项的详细信息
   */
  private static validate(inputConfig: unknown): AppConfig {
    const appConfig = plainToClass(AppConfig, inputConfig);
    const errors = validateSync(appConfig, {
      validationError: { target: true, value: true },
    });

    if (errors.length > 0) {
      throw new Error(
        `Config validation error: ${JSON.stringify(errors, null, 2)}`,
      );
    }
    return appConfig;
  }
}
