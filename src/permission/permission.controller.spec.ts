import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from './permission.entity';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { Connection, Repository } from 'typeorm';
import { PermissionController } from './permission.controller';
import { DivisionEntity } from '../tag/tag-division.entity';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import {
  GetPermissionError,
  SetPermissionError,
  SetPermissionRequestDto,
} from './dto';
import { UserModule } from '../user/user.module';

describe('PermissionController', () => {
  let controller: PermissionController;
  let connection: Connection;
  let divisions: DivisionEntity[];
  let perRepo: Repository<PermissionEntity>;
  let Root: UserEntity;
  let Admin: UserEntity;
  let Hrbp: UserEntity;
  let req: SetPermissionRequestDto;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([PermissionEntity]),
        forwardRef(() => DatabaseModule),
        ConfigModule,
        forwardRef(() => UserModule),
      ],
      providers: [PermissionService],
      controllers: [PermissionController],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    connection = module.get<Connection>(Connection);

    const divRepo = connection.getRepository(DivisionEntity);
    await divRepo.delete({});
    divisions = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        divRepo.save({ name: `Division ${i}` }),
      ),
    );
    const userRepo = connection.getRepository(UserEntity);
    await userRepo.delete({});
    Root = await createUser('root', [], true);
    Admin = await createUser('admin', [Role.ADMIN]);
    Hrbp = await createUser('hrbp', [Role.HRBP]);
    perRepo = connection.getRepository(PermissionEntity);
    await perRepo.delete({});
    req = { divisionIds: divisions.map((d) => d.id) };
  });

  async function createUser(
    username: string,
    roles: Role[],
    isRoot = false,
  ): Promise<UserEntity> {
    return connection.getRepository(UserEntity).save({
      username,
      realname: username,
      email: `${username}@null.boot`,
      publicEmail: true,
      roles,
      isRoot,
    });
  }

  it('set permission', async () => {
    expect(
      await controller.setPermission(null, Admin.id, Role.ADMIN, req),
    ).toEqual({ error: SetPermissionError.PERMISSION_DENIED });
    expect(
      await controller.setPermission(Admin, Admin.id, Role.ADMIN, req),
    ).toEqual({ error: SetPermissionError.PERMISSION_DENIED });

    expect(
      await controller.setPermission(Root, Admin.id, Role.HRBP, req),
    ).toEqual({ error: SetPermissionError.NO_SUCH_HRBP });
    expect(
      await controller.setPermission(Root, Hrbp.id, Role.ADMIN, req),
    ).toEqual({ error: SetPermissionError.NO_SUCH_ADMIN });

    expect(
      await controller.setPermission(Root, Admin.id, Role.ADMIN, {
        divisionIds: [-1],
      }),
    ).toEqual({ error: SetPermissionError.INVALID_DIVISION });

    expect(
      await controller.setPermission(Root, Admin.id, Role.ADMIN, req),
    ).toEqual({});
  });

  it('get permission', async () => {
    await controller.setPermission(Root, Admin.id, Role.ADMIN, req);
    await controller.setPermission(Root, Hrbp.id, Role.HRBP, {
      divisionIds: req.divisionIds.slice(0, 5),
    });

    expect(await controller.getPermission(null, Admin.id, Role.ADMIN)).toEqual({
      error: GetPermissionError.PERMISSION_DENIED,
    });
    expect(await controller.getPermission(Hrbp, Admin.id, Role.ADMIN)).toEqual({
      error: GetPermissionError.PERMISSION_DENIED,
    });
    expect(await controller.getPermission(Admin, Hrbp.id, Role.HRBP)).toEqual({
      error: GetPermissionError.PERMISSION_DENIED,
    });
    expect(await controller.getPermission(Root, Admin.id, Role.HRBP)).toEqual({
      error: GetPermissionError.NO_SUCH_HRBP,
    });
    expect(await controller.getPermission(Root, Hrbp.id, Role.ADMIN)).toEqual({
      error: GetPermissionError.NO_SUCH_ADMIN,
    });

    expect(await controller.getPermission(Admin, Admin.id, Role.ADMIN)).toEqual(
      { divisions: expect.arrayContaining(divisions) },
    );
    expect(await controller.getPermission(Hrbp, Hrbp.id, Role.HRBP)).toEqual({
      divisions: expect.arrayContaining(divisions.slice(0, 5)),
    });
  });

  afterEach(async () => {
    await perRepo.delete({});
  });

  afterAll(async () => {
    await connection.getRepository(UserEntity).delete({});
    await connection.getRepository(DivisionEntity).delete({});
    await connection.close();
  });
});
