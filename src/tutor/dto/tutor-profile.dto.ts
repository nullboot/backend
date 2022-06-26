import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../user/dto';

export class TutorProfileDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  isApproved: boolean;

  @ApiProperty()
  nominateTime: Date;

  @ApiProperty()
  approvedTime: Date;

  @ApiProperty()
  totalScore: number;

  @ApiProperty()
  averageScore: number;

  @ApiProperty()
  graduateNewbieCount: number;

  @ApiProperty()
  totalNewbieCount: number;

  @ApiProperty()
  isGraduate: boolean;

  @ApiProperty()
  graduationTime: Date;

  @ApiProperty({ type: UserProfileDto })
  userProfile: UserProfileDto;
}
