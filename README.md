# NullBoot-backend

`PRJ2B` 新人培训系统 - 后端

`null`小组：张艺缤 姚嘉宸 单敬博 张闰清 迟凯文

## Install

Install packages:

```shell
yarn
```

Create configuration file:

```shell
cp config-example.yaml config.yaml
```

### Database

This project depends on `MariaDB` / `Mysql`.

Create database in `mysql` console:

```mysql
CREATE DATABASE `nullboot` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `nullboot`.* TO "nullboot"@"%" IDENTIFIED BY "nullboooot";
```

## Start

Specify configuration file through environment variable `CONFIG_FILE` and start in develop mode:

```shell
export CONFIG_FILE=./config.yaml
yarn start:dev
```

## Start & Lint

```shell
yarn check-style  // prietter check
yarn format       // prietter format
yarn lint         // eslint
```

## Test

```shell
yarn test       // jest unit test
yarn test:e2e   // jest end-to-end test 
```

## 技术栈

- 语言：`TypeScript`
- 框架：`Nest.js`
- 包管理器：`yarn`
- 数据库：`MariaDB` (`TypeORM`)
- 对象存储(*TODO*)：`MinIO`
- API 文档：`Swagger` (`./docs`)

## 参考文档

- `NestJS`：[官方文档](https://docs.nestjs.com/) | [中文文档](https://docs.nestjs.cn/8/firststeps)
- `TypeORM`：[官方文档](https://typeorm.io/#/) | [中文文档](https://typeorm.bootcss.com/)
  | [Nest 中文开发手册](https://cloud.tencent.com/developer/section/1490182)
