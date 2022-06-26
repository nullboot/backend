import { ApiProperty } from '@nestjs/swagger';

export class DivisionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
export class CityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
