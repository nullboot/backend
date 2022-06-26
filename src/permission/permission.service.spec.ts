import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from './permission.entity';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { Connection, Repository } from 'typeorm';
import { DivisionEntity } from '../tag/tag-division.entity';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';

describe('PermissionService', () => {
  let service: PermissionService;
  let connection: Connection;
  let divisions: DivisionEntity[];
  let perRepo: Repository<PermissionEntity>;
  let Root: UserEntity;
  let Admin: UserEntity;
  let Hrbp: UserEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([PermissionEntity]),
        forwardRef(() => DatabaseModule),
        ConfigModule,
      ],
      providers: [PermissionService],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
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

  it('has permission', async () => {
    await service.setPermissions(
      Admin,
      Role.ADMIN,
      divisions.map((d) => d.id),
    );
    await service.setPermissions(Hrbp, Role.HRBP, [divisions[0].id]);

    // ROOT has all permissions
    expect(await service.hasPermission(Root, Role.ADMIN, divisions[0].id)).toBe(
      true,
    );
    expect(await service.hasPermission(Root, Role.HRBP, divisions[2].id)).toBe(
      true,
    );

    // Admin
    expect(
      await service.hasPermission(Admin, Role.ADMIN, divisions[0].id),
    ).toBe(true);
    expect(await service.hasPermission(Admin, Role.HRBP, divisions[0].id)).toBe(
      false,
    );

    // HRBP
    expect(await service.hasPermission(Hrbp, Role.ADMIN, divisions[0].id)).toBe(
      false,
    );
    expect(await service.hasPermission(Hrbp, Role.HRBP, divisions[0].id)).toBe(
      true,
    );
    expect(await service.hasPermission(Hrbp, Role.HRBP, divisions[2].id)).toBe(
      false,
    );
  });

  it('filter permissions', async () => {
    await service.setPermissions(
      Admin,
      Role.ADMIN,
      divisions.map((d) => d.id),
    );
    await service.setPermissions(Hrbp, Role.HRBP, [divisions[0].id]);

    // ROOT has all permissions
    expect(await service.filterPermissions(Root, Role.ADMIN)).toEqual(null);
    expect(
      await service.filterPermissions(Root, Role.HRBP, divisions[0]),
    ).toEqual([divisions[0].id]);

    // Admin
    expect(await service.filterPermissions(Admin, Role.ADMIN)).toContain(
      divisions[5].id,
    );
    expect(
      await service.filterPermissions(Admin, Role.ADMIN, divisions[0]),
    ).toEqual([divisions[0].id]);
    expect(
      await service.filterPermissions(Admin, Role.HRBP, divisions[0]),
    ).toEqual([]);

    // HRBP
    expect(await service.filterPermissions(Hrbp, Role.HRBP)).toEqual([
      divisions[0].id,
    ]);
    expect(
      await service.filterPermissions(Hrbp, Role.HRBP, divisions[0]),
    ).toEqual([divisions[0].id]);
    expect(
      await service.filterPermissions(Hrbp, Role.HRBP, divisions[2]),
    ).toEqual([]);
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
