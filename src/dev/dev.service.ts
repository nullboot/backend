import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { Repository } from 'typeorm';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { addUserRequestDto, addUserResponseDto } from './dto';
import * as bcrypt from 'bcrypt';
import { CityService } from '../tag/tag-city.service';
import { DivisionService } from '../tag/tag-division.service';
import { DivisionEntity } from '../tag/tag-division.entity';
import { CityEntity } from '../tag/tag-city.entity';

/**
 * [DEV] `DevService`: 进行一些辅助开发的数据处理
 */
@Injectable()
export class DevService {
  /**
   * 构造函数
   * @param userRepository `UserEntity` 的存储库
   * @param userAuthRepository `UserAuthEntity` 的存储库
   * @param cityRepo
   * @param cityService
   * @param divisionRepo
   * @param divisionService
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserAuthEntity)
    private readonly userAuthRepository: Repository<UserAuthEntity>,
    @InjectRepository(CityEntity)
    private readonly cityRepo: Repository<CityEntity>,
    @Inject(forwardRef(() => CityService))
    private readonly cityService: CityService,
    @InjectRepository(DivisionEntity)
    private readonly divisionRepo: Repository<DivisionEntity>,
    @Inject(forwardRef(() => DivisionService))
    private readonly divisionService: DivisionService,
  ) {}

  /**
   * 添加一个部门
   */
  async addDivision(
    divisionId: number,
    divisionName: string,
  ): Promise<[error: string, division: DivisionEntity]> {
    if (divisionId) {
      let division = await this.divisionService.findById(divisionId);
      if (division)
        return await this.divisionService.update(division, divisionName);
      try {
        division = await this.divisionRepo.save({
          id: divisionId,
          name: divisionName,
        });
      } catch (e) {
        return [`An unexpected error occurred: ${e.message}`, null];
      }
      return [null, division];
    }
    return await this.divisionService.create(divisionName);
  }

  /**
   * 添加一个城市
   */
  async addCity(
    cityId: number,
    cityName: string,
  ): Promise<[error: string, city: CityEntity]> {
    if (cityId) {
      let city = await this.cityService.findById(cityId);
      if (city) return await this.cityService.update(city, cityName);
      try {
        city = await this.cityRepo.save({
          id: cityId,
          name: cityName,
        });
      } catch (e) {
        return [`An unexpected error occurred: ${e.message}`, null];
      }
      return [null, city];
    }
    return await this.cityService.create(cityName);
  }

  /**
   * 添加一个用户
   * @param req 用户的全部信息
   */
  async addUser(req: addUserRequestDto): Promise<addUserResponseDto> {
    let user: UserEntity;
    try {
      user = await this.userRepository.save({
        id: req.id,
        username: req.username,
        realname: req.realname || 'unknown',
        email: req.email,
        publicEmail: req.publicEmail,
        isRoot: req.isRoot,
        roles: [],
        registerTime: new Date(),
        divisionId: req.divisionId,
        cityId: req.cityId,
      });
      await this.userAuthRepository.save({
        userId: req.id,
        password: await bcrypt.hash(req.password, 10),
      });
    } catch (e) {
      return { error: `An unexpected error occurred: ${e.message}` };
    }
    return {
      profile: {
        id: user.id,
        username: user.username,
        realname: user.realname,
        email: user.email,
        publicEmail: user.publicEmail,
        isRoot: user.isRoot,
        registerTime: user.registerTime,
        roles: user.roles,
        city: await this.cityService.getDtoById(user.cityId),
        division: await this.divisionService.getDtoById(user.divisionId),
      },
      password: req.password,
    };
  }
}
