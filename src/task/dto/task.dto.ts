import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';
import { ArrayUnique, IsArray, IsString, Length } from 'class-validator';

export class TaskDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({})
  tags: string[];

  @ApiProperty({ type: UserProfileDto })
  ownerProfile: UserProfileDto;

  @ApiProperty()
  isUsed: boolean;
}

export class TaskRequestDto {
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
}

export class TaskForTraineeDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  day: number;

  @ApiProperty()
  finished: boolean;
}
