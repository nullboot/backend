import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './file.entity';
import { ConfigModule } from '../config/config.module';
import { Connection, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { Role } from '../common/role';
import {
  DoneFileUploadError,
  DoneFileUploadRequestDto,
  SignFileUploadError,
  SignFileUploadRequestDto,
} from './dto';
import { v4 as UUID } from 'uuid';

describe('FileController', () => {
  let controller: FileController;
  let connection: Connection;
  let fileRepo: Repository<FileEntity>;
  let Root: UserEntity;
  let Admin: UserEntity;
  let User: UserEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [FileService],
      imports: [
        ConfigModule,
        forwardRef(() => DatabaseModule),
        TypeOrmModule.forFeature([FileEntity]),
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
    connection = module.get<Connection>(Connection);
    fileRepo = connection.getRepository(FileEntity);
    await fileRepo.delete({});
    const userRepo = connection.getRepository(UserEntity);
    await userRepo.delete({});
    Root = await createUser('root', [], true);
    Admin = await createUser('admin', [Role.ADMIN]);
    User = await createUser('user', []);
  });

  async function createUser(
    username: string,
    roles: Role[],
    isRoot = false,
  ): Promise<UserEntity> {
    return await connection.getRepository(UserEntity).save({
      username: username,
      realname: username,
      email: `${username}@null.boot`,
      publicEmail: true,
      isRoot,
      roles,
    });
  }

  it('sign file upload', async () => {
    const req: SignFileUploadRequestDto = { size: 0 };

    expect(await controller.signFileUpload(null, req)).toEqual({
      error: SignFileUploadError.PERMISSION_DENIED,
    });
    expect(await controller.signFileUpload(User, req)).toEqual({
      error: SignFileUploadError.PERMISSION_DENIED,
    });

    expect(
      await controller.signFileUpload(Root, { size: 10 * 1024 * 1024 * 1024 }),
    ).toEqual({ error: SignFileUploadError.FILE_TOO_LARGE });

    expect(await controller.signFileUpload(Root, req)).toEqual({
      signedRequest: expect.any(Object),
    });
    expect(await controller.signFileUpload(Admin, req)).toEqual({
      signedRequest: expect.any(Object),
    });
  });

  it('done file upload', async () => {
    const req: DoneFileUploadRequestDto = { size: 0, uuid: UUID() };

    expect(await controller.doneFileUpload(null, req)).toEqual({
      error: DoneFileUploadError.PERMISSION_DENIED,
    });
    expect(await controller.doneFileUpload(User, req)).toEqual({
      error: DoneFileUploadError.PERMISSION_DENIED,
    });

    expect(await controller.doneFileUpload(Root, req)).toEqual({
      error: DoneFileUploadError.FILE_NOT_UPLOADED,
    });

    await fileRepo.save({
      uuid: req.uuid,
      size: req.size,
      uploadTime: new Date(),
    });

    expect(await controller.doneFileUpload(Root, req)).toEqual({
      error: DoneFileUploadError.FILE_UUID_EXISTS,
    });
  });

  afterAll(async () => {
    await connection.getRepository(UserEntity).delete({});
    await fileRepo.delete({});
    await connection.close();
  });
});
