import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ExamProblemType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

export class ProblemWithoutAnswersDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  options: string[];

  @ApiProperty({ enum: ExamProblemType })
  type: ExamProblemType;
}

export class ProblemDto extends ProblemWithoutAnswersDto {
  @ApiProperty()
  answers: number[];

  @ApiProperty()
  reason: string;
}

abstract class ExamBaseDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  tags: string[];
}

export class ExamDto extends ExamBaseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: ProblemDto, isArray: true })
  problems: ProblemDto[];

  @ApiProperty({ type: UserProfileDto })
  ownerProfile: UserProfileDto;

  @ApiProperty()
  isUsed: boolean;
}

export class ExamForTraineeDto extends ExamBaseDto {
  @ApiProperty({ type: ProblemWithoutAnswersDto, isArray: true })
  problems: ProblemWithoutAnswersDto[];

  @ApiProperty()
  day: number;

  @ApiProperty()
  finished: boolean;
}

export class ProblemRequestDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString({ each: true })
  @IsArray()
  @ArrayUnique()
  options: string[];

  @ApiProperty({ enum: ExamProblemType })
  @IsEnum(ExamProblemType)
  type: ExamProblemType;

  @ApiProperty()
  @IsInt({ each: true })
  @IsArray()
  @ArrayUnique()
  answers: number[];

  @ApiProperty()
  @IsString()
  reason: string;
}

export class ExamRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 80)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString({ each: true })
  @IsArray()
  @ArrayUnique()
  tags: string[];

  @ApiProperty({ type: ProblemRequestDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => ProblemRequestDto)
  @ArrayNotEmpty()
  @IsArray()
  problems: ProblemRequestDto[];
}

export class ExamAnswersRequestDto {
  @ApiProperty()
  @IsInt({ each: true })
  @IsArray()
  @ArrayUnique()
  answers: number[];
}

export class ExamAnswersResponseDto {
  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  answers: number[];

  @ApiProperty()
  reason: string;
}
