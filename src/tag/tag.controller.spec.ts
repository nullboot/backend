import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from './tag.controller';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { CityService } from './tag-city.service';
import { DivisionEntity } from './tag-division.entity';
import { CityEntity } from './tag-city.entity';
import { DivisionService } from './tag-division.service';
import { UserModule } from '../user/user.module';
import { TemplateModule } from '../template/template.module';
import { UserEntity } from '../user/user.entity';
import {
  CreateCityError,
  CreateDivisionError,
  DeleteCityError,
  DeleteDivisionError,
  GetCityError,
  GetDivisionError,
  UpdateCityError,
  UpdateDivisionError,
} from './dto';
import { DefaultError } from '../common/types';

describe('TagController', () => {
  let controller: TagController;
  let connection: Connection;
  let Root: UserEntity;
  let User: UserEntity;
  let req;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([DivisionEntity, CityEntity]),
        forwardRef(() => DatabaseModule),
        forwardRef(() => UserModule),
        ConfigModule,
        forwardRef(() => TemplateModule),
      ],
      providers: [DivisionService, CityService],
      controllers: [TagController],
    }).compile();

    controller = module.get<TagController>(TagController);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(CityEntity).delete({});
    await connection.getRepository(DivisionEntity).delete({});
    await connection.getRepository(UserEntity).delete({});
    Root = await createUser('root', true);
    User = await createUser('user');
    req = { name: 'test' };
  });

  async function createUser(
    username: string,
    isRoot = false,
  ): Promise<UserEntity> {
    return await connection.getRepository(UserEntity).save({
      username: username,
      realname: username,
      email: `${username}@null.boot`,
      publicEmail: true,
      isRoot,
      roles: [],
    });
  }

  it('create division', async () => {
    expect(await controller.createDivision(null, req)).toEqual({
      error: CreateDivisionError.PERMISSION_DENIED,
    });
    expect(await controller.createDivision(User, req)).toEqual({
      error: CreateDivisionError.PERMISSION_DENIED,
    });

    expect(await controller.createDivision(Root, req)).toEqual({
      division: { id: expect.any(Number), name: 'test' },
    });
    expect(await controller.createDivision(Root, req)).toEqual({
      error: CreateDivisionError.DUPLICATE_DIVISION_NAME,
    });
  });

  it('create city', async () => {
    expect(await controller.createCity(null, req)).toEqual({
      error: CreateCityError.PERMISSION_DENIED,
    });
    expect(await controller.createCity(User, req)).toEqual({
      error: CreateCityError.PERMISSION_DENIED,
    });

    expect(await controller.createCity(Root, req)).toEqual({
      city: { id: expect.any(Number), name: 'test' },
    });
    expect(await controller.createCity(Root, req)).toEqual({
      error: CreateCityError.DUPLICATE_CITY_NAME,
    });
  });

  it('delete division', async () => {
    const { division } = await controller.createDivision(Root, req);

    expect(await controller.deleteDivision(null, division.id)).toEqual({
      error: DeleteDivisionError.PERMISSION_DENIED,
    });
    expect(await controller.deleteDivision(User, division.id)).toEqual({
      error: DeleteDivisionError.PERMISSION_DENIED,
    });

    expect(await controller.deleteDivision(Root, -1)).toEqual({
      error: DeleteDivisionError.NO_SUCH_DIVISION,
    });

    await connection.getRepository(UserEntity).save({
      ...User,
      divisionId: division.id,
    });
    expect(await controller.deleteDivision(Root, division.id)).toEqual({
      error: DeleteDivisionError.DIVISION_NOT_EMPTY,
    });

    await connection.getRepository(UserEntity).save({
      ...User,
      divisionId: null,
    });
    expect(await controller.deleteDivision(Root, division.id)).toEqual({});
  });

  it('delete city', async () => {
    const { city } = await controller.createCity(Root, req);

    expect(await controller.deleteCity(null, city.id)).toEqual({
      error: DeleteCityError.PERMISSION_DENIED,
    });
    expect(await controller.deleteCity(User, city.id)).toEqual({
      error: DeleteCityError.PERMISSION_DENIED,
    });

    expect(await controller.deleteCity(Root, -1)).toEqual({
      error: DeleteCityError.NO_SUCH_CITY,
    });

    expect(await controller.deleteCity(Root, city.id)).toEqual({});
  });

  it('update division', async () => {
    const { division } = await controller.createDivision(Root, req);

    expect(await controller.updateDivision(null, division.id, req)).toEqual({
      error: UpdateDivisionError.PERMISSION_DENIED,
    });
    expect(await controller.updateDivision(User, division.id, req)).toEqual({
      error: UpdateDivisionError.PERMISSION_DENIED,
    });

    expect(await controller.updateDivision(Root, -1, req)).toEqual({
      error: UpdateDivisionError.NO_SUCH_DIVISION,
    });

    expect(
      await controller.updateDivision(Root, division.id, { name: 'jest' }),
    ).toEqual({
      division: { id: division.id, name: 'jest' },
    });

    const { division: division2 } = await controller.createDivision(Root, {
      name: 'test2',
    });
    expect(
      await controller.updateDivision(Root, division2.id, { name: 'jest' }),
    ).toEqual({
      error: UpdateDivisionError.DUPLICATE_DIVISION_NAME,
    });
  });

  it('update city', async () => {
    const { city } = await controller.createCity(Root, req);

    expect(await controller.updateCity(null, city.id, req)).toEqual({
      error: UpdateCityError.PERMISSION_DENIED,
    });
    expect(await controller.updateCity(User, city.id, req)).toEqual({
      error: UpdateCityError.PERMISSION_DENIED,
    });

    expect(await controller.updateCity(Root, -1, req)).toEqual({
      error: UpdateCityError.NO_SUCH_CITY,
    });

    expect(
      await controller.updateCity(Root, city.id, { name: 'jest' }),
    ).toEqual({
      city: { id: city.id, name: 'jest' },
    });

    const { city: city2 } = await controller.createCity(Root, {
      name: 'test2',
    });
    expect(
      await controller.updateCity(Root, city2.id, { name: 'jest' }),
    ).toEqual({
      error: UpdateCityError.DUPLICATE_CITY_NAME,
    });
  });

  it('get division', async () => {
    const { division } = await controller.createDivision(Root, req);

    expect(await controller.getDivision(null, division.id)).toEqual({
      error: GetDivisionError.PERMISSION_DENIED,
    });

    expect(await controller.getDivision(Root, -1)).toEqual({
      error: GetDivisionError.NO_SUCH_DIVISION,
    });

    expect(await controller.getDivision(Root, division.id)).toEqual({
      division: { id: division.id, name: 'test' },
    });
    expect(await controller.getDivision(User, division.id)).toEqual({
      division: { id: division.id, name: 'test' },
    });
  });

  it('get city', async () => {
    const { city } = await controller.createCity(Root, req);

    expect(await controller.getCity(null, city.id)).toEqual({
      error: GetCityError.PERMISSION_DENIED,
    });

    expect(await controller.getCity(Root, -1)).toEqual({
      error: GetCityError.NO_SUCH_CITY,
    });

    expect(await controller.getCity(Root, city.id)).toEqual({
      city: { id: city.id, name: 'test' },
    });
    expect(await controller.getCity(User, city.id)).toEqual({
      city: { id: city.id, name: 'test' },
    });
  });

  it('get division list', async () => {
    const { division } = await controller.createDivision(Root, req);

    expect(await controller.getDivisions(null)).toEqual({
      error: DefaultError.PERMISSION_DENIED,
    });

    expect(await controller.getDivisions(User)).toEqual({
      divisions: [{ id: division.id, name: 'test' }],
    });
  });

  it('get city list', async () => {
    const { city } = await controller.createCity(Root, req);

    expect(await controller.getCities(null)).toEqual({
      error: DefaultError.PERMISSION_DENIED,
    });

    expect(await controller.getCities(User)).toEqual({
      cities: [{ id: city.id, name: 'test' }],
    });
  });

  afterEach(async () => {
    await connection.getRepository(CityEntity).delete({});
    await connection.getRepository(DivisionEntity).delete({});
  });

  afterAll(async () => {
    await connection.getRepository(UserEntity).delete({});
    await connection.close();
  });
});
