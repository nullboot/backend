import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';
import { TutorProfileDto } from '../../tutor/dto';

export class NewbieProfileDto {
  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  tutorProfile: TutorProfileDto;

  @ApiProperty()
  graduationTime: Date;

  @ApiProperty()
  assignedTime: Date;

  @ApiProperty()
  isAssigned: boolean;

  @ApiProperty()
  isGraduate: boolean;

  @ApiProperty()
  onBoarding: boolean;

  @ApiPropertyOptional()
  examAverageScore: number;

  @ApiProperty({ type: UserProfileDto })
  userProfile: UserProfileDto;
}
