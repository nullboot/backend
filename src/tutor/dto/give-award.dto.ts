import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';
import { TutorAwardDto } from './tutor-award.dto';
import { TutorProfileDto } from './tutor-profile.dto';

export enum GiveAwardError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_SUCH_TUTOR = 'NO_SUCH_TUTOR',
  NOT_GRADUATED = 'NOT_GRADUATED',
}

export class GiveAwardRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 80)
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  level: number;
}

export class GiveAwardResponseDto {
  @ApiPropertyOptional({ enum: GiveAwardError })
  error?: GiveAwardError;

  @ApiPropertyOptional({ type: TutorAwardDto })
  award?: TutorAwardDto;

  @ApiPropertyOptional({ type: TutorProfileDto })
  profile?: TutorProfileDto;
}
