import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

/**
 * 初始化应用
 *
 * - 设置全局 API 前缀
 * - 创建 Swagger API 文档
 */
async function initialize() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageInfo = require('../package.json');
  const appVersion = `v${packageInfo.version}`;

  Logger.log(`Starting ${packageInfo.name}`, 'Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(json({ limit: '1024mb' }));

  const apiOptions = new DocumentBuilder()
    .setTitle(packageInfo.name)
    .setDescription(packageInfo.description)
    .setVersion(appVersion)
    .addBearerAuth()
    .build();
  const apiDocument = SwaggerModule.createDocument(app, apiOptions);
  SwaggerModule.setup('/docs', app, apiDocument);

  return [packageInfo, configService, app];
}

/**
 * 启动应用
 * @param packageInfo 软件包信息
 * @param configService 配置服务
 * @param app 应用实例
 */
async function startApp(
  packageInfo: any,
  configService: ConfigService,
  app: NestExpressApplication,
) {
  await app.listen(
    configService.config.server.port,
    configService.config.server.hostname,
  );
  Logger.log(
    `${packageInfo.name} is listening on ${configService.config.server.hostname}:${configService.config.server.port}`,
    'Bootstrap',
  );
}

/**
 * 应用入口
 */
async function bootstrap() {
  const [packageInfo, configService, app] = await initialize();
  await startApp(packageInfo, configService, app);
}

/**
 * 异常处理
 */
bootstrap().catch((err) => {
  Logger.error(`${err}`, 'Bootstrap');
  Logger.error('Error bootstrapping the application, exiting...', 'Bootstrap');
  process.exit(1);
});
