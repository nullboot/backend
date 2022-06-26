import { Body, Controller, forwardRef, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DevService } from './dev.service';
import { addUserRequestDto, addUserResponseDto } from './dto';
import { CityService } from '../tag/tag-city.service';
import { DivisionService } from '../tag/tag-division.service';
import { addTagRequestDto, addTagResponseDto } from './dto';
import { CityDto, DivisionDto } from '../tag/dto';

/**
 * [DEV] `DevController`: 处理一些辅助开发的 API 请求
 */
@ApiTags('DEV')
@Controller('dev')
export class DevController {
  constructor(
    private readonly devService: DevService,
    @Inject(forwardRef(() => DivisionService))
    private readonly divisionService: DivisionService,
    @Inject(forwardRef(() => CityService))
    private readonly cityService: CityService,
  ) {}

  /**
   * 添加部门和城市，**没有任何检查**
   * @param req 请求体：{divisionName, cityName}
   * @returns 成功：`201: {divisionId, cityId}`；失败：`201: {error}`
   */
  @Post('addTag')
  @ApiOperation({
    summary: '添加部门和城市，不进行任何检查',
    description: '直接向数据库中保存，不进行任何检查，可能覆盖已有部门和城市',
  })
  async addTag(@Body() req: addTagRequestDto): Promise<addTagResponseDto> {
    let divisionDto: DivisionDto;
    let cityDto: CityDto;
    if (req.divisionName) {
      const [error, division] = await this.devService.addDivision(
        req.divisionId,
        req.divisionName,
      );
      if (error) return { error };
      divisionDto = DivisionService.toDto(division);
    }
    if (req.cityName) {
      const [error, city] = await this.devService.addCity(
        req.cityId,
        req.cityName,
      );
      if (error) return { error };
      cityDto = CityService.toDto(city);
    }
    return { city: cityDto, division: divisionDto };
  }

  /**
   * 添加用户，**没有任何检查**
   * @param req 请求体：用户的全部信息
   * @returns 成功：`201: {profile, roles, password}`；失败：`201: {error}`
   */
  @Post('addUser')
  @ApiOperation({
    summary: '添加用户，不进行任何检查',
    description: '直接向数据库中保存，不进行任何检查，可能覆盖已有用户',
  })
  async addUser(@Body() req: addUserRequestDto): Promise<addUserResponseDto> {
    return await this.devService.addUser(req);
  }
}
