import { PaginateResponseDto, PaginateUserRequestDto } from '../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TutorProfileDto } from './tutor-profile.dto';
import { IsBooleanInQuery } from '../../common/validators';

export enum TutorStatus {
  graduated = 'graduated', // 已上岗
  training = 'training', // 培训中
  approved = 'approved', // 已通过（HRBP审核通过）
  rejected = 'rejected', // 已拒绝（HRBP拒绝）
  pending = 'pending', // 待审核（ADMIN提名，HRBP未审核）
}

export class GetTutorsRequestDto extends PaginateUserRequestDto {
  @ApiPropertyOptional({ enum: TutorStatus })
  @IsOptional()
  @IsEnum(TutorStatus)
  status?: TutorStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanInQuery()
  pendingFirst?: boolean;
}

export enum GetTutorsError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TAKE_TOO_MANY = 'TAKE_TOO_MANY',
  INVALID_CITY = 'INVALID_CITY',
  INVALID_DIVISION = 'INVALID_DIVISION',
}

export class GetTutorsResponseDto extends PaginateResponseDto {
  @ApiPropertyOptional({ enum: GetTutorsError })
  error?: GetTutorsError;

  @ApiPropertyOptional({ isArray: true, type: TutorProfileDto })
  tutors?: TutorProfileDto[];
}
