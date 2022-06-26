import {
  IsBoolean,
  IsInt,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { applyDecorators, Param, ParseIntPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';

/**
 * @internal
 * 校验注解封装
 * @param callback 校验回调函数
 * @param validationOptions 校验选项
 */
export function If<T>(
  callback: (value: T) => boolean,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: T) {
          return callback(value);
        },
      },
    });
  };
}

/**
 * `IsPortNumber` 注解：校验属性是否为 `number` 类型的端口编号
 * @param validationOptions 校验选项
 */
export function IsPortNumber(validationOptions?: ValidationOptions) {
  return If(
    (value) => Number.isInteger(value) && value >= 1 && value <= 65535,
    validationOptions,
  );
}

/**
 * `isUsername`: 检验是否为合法的用户名
 *
 * 由中文、英文、数字、`-_.#^$` 组成，长度为 3-24 个字符
 * @param str 用户名
 */
function isUsername(str: string) {
  return /^[a-zA-Z0-9\-_.#^$\u4e00-\u9fa5]{3,24}$/.test(str);
}

/**
 * `IsUsername` 注解：校验属性是否为合法的用户名
 * @param validationOptions 校验选项
 */
export function IsUsername(validationOptions?: ValidationOptions) {
  return If(
    (value) => typeof value == 'string' && isUsername(value),
    validationOptions,
  );
}

/**
 * `IntParam` 注解：将路径参数转换为整数
 * @param property 参数名
 */
export const IntParam = (property: string) => Param(property, ParseIntPipe);

/**
 * `parseBoolean`: 将字符串转换为布尔值
 * @param value 待转换的字符串
 */
function parseBoolean(value: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/**
 * `IsBooleanInQuery` 注解：转换并校验 GET 请求参数是否为布尔值
 */
export function IsBooleanInQuery() {
  return applyDecorators(
    Transform(({ value }) => parseBoolean(value)),
    IsBoolean,
  );
}

/**
 * `IsIntInQuery` 注解：转换并校验 GET 请求参数是否为整数
 */
export function IsIntInQuery() {
  return applyDecorators(
    Transform(({ value }) => parseInt(value)),
    IsInt,
  );
}
