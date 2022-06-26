import { Test, TestingModule } from '@nestjs/testing';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { Connection } from 'typeorm';
import { DivisionService } from './tag-division.service';
import { CityService } from './tag-city.service';
import { DivisionEntity } from './tag-division.entity';
import { CityEntity } from './tag-city.entity';
import { UserModule } from '../user/user.module';
import { TemplateModule } from '../template/template.module';

describe('TagService', () => {
  let divService: DivisionService;
  let citService: CityService;
  let connection: Connection;
  let div: DivisionEntity;
  let cit: CityEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        ConfigModule,
        TypeOrmModule.forFeature([DivisionEntity]),
        TypeOrmModule.forFeature([CityEntity]),
        forwardRef(() => TemplateModule),
      ],
      providers: [DivisionService, CityService],
    }).compile();

    divService = module.get<DivisionService>(DivisionService);
    citService = module.get<CityService>(CityService);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(DivisionEntity).delete({});
    await connection.getRepository(CityEntity).delete({});
    div = (await divService.create('division'))[1];
    cit = (await citService.create('city'))[1];
  });

  it('division: get dto by id', async () => {
    expect(await divService.getDtoById(div.id)).toEqual(div);
  });

  it('city: get dto by id', async () => {
    expect(await citService.getDtoById(cit.id)).toEqual(cit);
  });

  it('division: validate', async () => {
    expect(await divService.validate(div.id)).toBe(true);
    expect(await divService.validate(-1)).toBe(false);
    expect(await divService.validate(null)).toBe(false);
    expect(await divService.validate(undefined)).toBe(false);
  });

  it('city: validate', async () => {
    expect(await citService.validate(cit.id)).toBe(true);
    expect(await citService.validate(-1)).toBe(false);
    expect(await citService.validate(null)).toBe(true); // NOTE: city is nullable
  });

  it('division: check existence by ids', async () => {
    expect(await divService.checkExistenceByIds([div.id])).toBe(true);
    expect(await divService.checkExistenceByIds([])).toBe(true);
    expect(await divService.checkExistenceByIds([-1])).toBe(false);
    expect(await divService.checkExistenceByIds([null])).toBe(false);
  });

  afterAll(async () => {
    await connection.getRepository(DivisionEntity).delete({});
    await connection.getRepository(CityEntity).delete({});
    await connection.close();
  });
});
