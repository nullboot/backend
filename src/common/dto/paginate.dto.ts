import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { IsIntInQuery } from '../validators';
import { Role } from '../role';

export class PaginateRequestDto {
  @ApiPropertyOptional({ description: '跳过项数', example: 0 })
  @IsOptional()
  @IsIntInQuery()
  @Min(0)
  readonly skip?: number;

  @ApiProperty({ description: '获取项数', example: 10 })
  @IsIntInQuery()
  @Min(1)
  readonly take: number;

  @ApiPropertyOptional({
    description: '当前角色（在需要区分角色时提供）',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsEnum(Role)
  readonly currentRole?: Role;
}

export enum WildcardType {
  BEGIN = 'BEGIN',
  END = 'END',
  BOTH = 'BOTH',
  NONE = 'NONE',
}

export class PaginateUserRequestDto extends PaginateRequestDto {
  @ApiPropertyOptional({ description: '筛选：城市标签' })
  @IsOptional()
  @IsIntInQuery()
  readonly cityId?: number;

  @ApiPropertyOptional({ description: '筛选：部门标签' })
  @IsOptional()
  @IsIntInQuery()
  readonly divisionId?: number;

  @ApiPropertyOptional({ description: '搜索：关键字（真实姓名）' })
  @IsOptional()
  @IsString()
  readonly keyword?: string;

  @ApiPropertyOptional({ description: '搜索：通配符位置' })
  @IsOptional()
  @IsEnum(WildcardType)
  readonly wildcard?: WildcardType;
}

export class PaginateResponseDto {
  @ApiPropertyOptional({ description: '总项数' })
  count?: number;
}
