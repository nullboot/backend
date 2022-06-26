import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/user.decorator';
import {
  CreateCityError,
  CreateCityRequestDto,
  CreateCityResponseDto,
  CreateDivisionError,
  CreateDivisionRequestDto,
  CreateDivisionResponseDto,
  DeleteCityError,
  DeleteCityResponseDto,
  DeleteDivisionError,
  DeleteDivisionResponseDto,
  GetCitiesResponseDto,
  GetCityError,
  GetCityResponseDto,
  GetDivisionError,
  GetDivisionResponseDto,
  GetDivisionsResponseDto,
  UpdateCityError,
  UpdateCityRequestDto,
  UpdateCityResponseDto,
  UpdateDivisionError,
  UpdateDivisionRequestDto,
  UpdateDivisionResponseDto,
} from './dto';
import { DefaultError } from '../common/types';
import { IntParam } from '../common/validators';
import { CityService } from './tag-city.service';
import { DivisionService } from './tag-division.service';
import { UserService } from '../user/user.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tag')
export class TagController {
  constructor(
    private readonly userService: UserService,
    private readonly divisionService: DivisionService,
    private readonly cityService: CityService,
  ) {}

  @ApiTags('TAG::Division', 'LIST')
  @Get('division')
  @ApiOperation({ summary: '获取部门列表' })
  async getDivisions(
    @CurrentUser() currentUser,
  ): Promise<GetDivisionsResponseDto> {
    if (!currentUser) return { error: DefaultError.PERMISSION_DENIED };

    const list = await this.divisionService.getList();

    return {
      divisions: list.map((division) => DivisionService.toDto(division)),
    };
  }

  @ApiTags('TAG::City', 'LIST')
  @Get('city')
  @ApiOperation({ summary: '获取城市列表' })
  async getCities(@CurrentUser() currentUser): Promise<GetCitiesResponseDto> {
    if (!currentUser) return { error: DefaultError.PERMISSION_DENIED };

    const list = await this.cityService.getList();

    return {
      cities: list.map((city) => CityService.toDto(city)),
    };
  }

  @ApiTags('TAG::Division')
  @Post('division/new')
  @ApiOperation({
    summary: '添加部门',
    description: '只有 ROOT 能够使用此功能',
  })
  async createDivision(
    @CurrentUser() currentUser,
    @Body() req: CreateDivisionRequestDto,
  ): Promise<CreateDivisionResponseDto> {
    if (!currentUser || !currentUser.isRoot)
      return { error: CreateDivisionError.PERMISSION_DENIED };

    const [error, division] = await this.divisionService.create(req.name);
    if (error) return { error };

    return { division: DivisionService.toDto(division) };
  }

  @ApiTags('TAG::City')
  @Post('city/new')
  @ApiOperation({
    summary: '添加城市',
    description: '只有 ROOT 能够使用此功能',
  })
  async createCity(
    @CurrentUser() currentUser,
    @Body() req: CreateCityRequestDto,
  ): Promise<CreateCityResponseDto> {
    if (!currentUser || !currentUser.isRoot)
      return { error: CreateCityError.PERMISSION_DENIED };

    const [error, city] = await this.cityService.create(req.name);
    if (error) return { error };

    return { city: CityService.toDto(city) };
  }

  @ApiTags('TAG::Division')
  @Delete('division/:id')
  @ApiOperation({
    summary: '删除部门',
    description: '只有 ROOT 能够使用此功能；当部门中还有用户时不能删除',
  })
  async deleteDivision(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<DeleteDivisionResponseDto> {
    if (!currentUser || !currentUser.isRoot)
      return { error: DeleteDivisionError.PERMISSION_DENIED };

    const division = await this.divisionService.findById(id);
    if (!division) return { error: DeleteDivisionError.NO_SUCH_DIVISION };

    const count = await this.userService.getCountByDivisionId(id);
    if (count > 0) return { error: DeleteDivisionError.DIVISION_NOT_EMPTY };

    await this.divisionService.delete(division);
    return {};
  }

  @ApiTags('TAG::City')
  @Delete('city/:id')
  @ApiOperation({
    summary: '删除城市',
    description: '只有 ROOT 能够使用此功能',
  })
  async deleteCity(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<DeleteCityResponseDto> {
    if (!currentUser || !currentUser.isRoot)
      return { error: DeleteCityError.PERMISSION_DENIED };

    const city = await this.cityService.findById(id);
    if (!city) return { error: DeleteCityError.NO_SUCH_CITY };

    await this.cityService.delete(city);

    return {};
  }

  @ApiTags('TAG::Division')
  @Post('division/:id')
  @ApiOperation({
    summary: '修改部门信息',
    description: '只有 ROOT 能够使用此功能',
  })
  async updateDivision(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
    @Body() req: UpdateDivisionRequestDto,
  ): Promise<UpdateDivisionResponseDto> {
    if (!currentUser || !currentUser.isRoot)
      return { error: UpdateDivisionError.PERMISSION_DENIED };

    const division = await this.divisionService.findById(id);
    if (!division) return { error: UpdateDivisionError.NO_SUCH_DIVISION };

    const [error, newDivision] = await this.divisionService.update(
      division,
      req.name,
    );
    if (error) return { error };

    return { division: DivisionService.toDto(newDivision) };
  }

  @ApiTags('TAG::City')
  @Post('city/:id')
  @ApiOperation({
    summary: '修改城市信息',
    description: '只有 ROOT 能够使用此功能',
  })
  async updateCity(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
    @Body() req: UpdateCityRequestDto,
  ): Promise<UpdateCityResponseDto> {
    if (!currentUser || !currentUser.isRoot)
      return { error: UpdateCityError.PERMISSION_DENIED };

    const city = await this.cityService.findById(id);
    if (!city) return { error: UpdateCityError.NO_SUCH_CITY };

    const [error, newCity] = await this.cityService.update(city, req.name);
    if (error) return { error };

    return { city: CityService.toDto(newCity) };
  }

  @ApiTags('TAG::Division')
  @Get('division/:id')
  @ApiOperation({ summary: '获取部门信息' })
  async getDivision(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<GetDivisionResponseDto> {
    if (!currentUser) return { error: GetDivisionError.PERMISSION_DENIED };

    const division = await this.divisionService.findById(id);
    if (!division) return { error: GetDivisionError.NO_SUCH_DIVISION };

    return { division: DivisionService.toDto(division) };
  }

  @ApiTags('TAG::City')
  @Get('city/:id')
  @ApiOperation({ summary: '获取城市信息' })
  async getCity(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<GetCityResponseDto> {
    if (!currentUser) return { error: GetCityError.PERMISSION_DENIED };

    const city = await this.cityService.findById(id);
    if (!city) return { error: GetCityError.NO_SUCH_CITY };

    return { city: CityService.toDto(city) };
  }
}
