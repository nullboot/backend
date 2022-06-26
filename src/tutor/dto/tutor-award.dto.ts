import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TutorAwardDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string;

  @ApiProperty()
  level: number;

  @ApiProperty({ type: Date })
  achieveTime: Date;
}
