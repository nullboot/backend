import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityDto, CreateCityError, UpdateCityError } from './dto';
import { CityEntity } from './tag-city.entity';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(CityEntity)
    private readonly cityRepository: Repository<CityEntity>,
  ) {}

  async findById(id: number): Promise<CityEntity> {
    return await this.cityRepository.findOne(id);
  }

  async findByName(name: string): Promise<CityEntity> {
    return await this.cityRepository.findOne({ name });
  }

  static toDto(city: CityEntity): CityDto {
    return { id: city.id, name: city.name };
  }

  async getDtoById(id: number): Promise<CityDto> {
    if (id == null) return null;
    const city = await this.findById(id);
    return CityService.toDto(city);
  }

  async getList(): Promise<CityEntity[]> {
    return await this.cityRepository.find({});
  }

  async create(name: string): Promise<[CreateCityError, CityEntity]> {
    if (await this.findByName(name))
      return [CreateCityError.DUPLICATE_CITY_NAME, null];
    return [null, await this.cityRepository.save({ name })];
  }

  async delete(city: CityEntity) {
    await this.cityRepository.remove(city);
  }

  async update(
    city: CityEntity,
    name: string,
  ): Promise<[UpdateCityError, CityEntity]> {
    if (name !== city.name && (await this.findByName(name)))
      return [UpdateCityError.DUPLICATE_CITY_NAME, null];
    city.name = name;
    return [null, await this.cityRepository.save(city)];
  }

  async validate(id: number): Promise<boolean> {
    if (id == null) return true;
    return !!(await this.findById(id));
  }
}
