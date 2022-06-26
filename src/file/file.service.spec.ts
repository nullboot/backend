import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { ConfigModule } from '../config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './file.entity';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { Connection } from 'typeorm';
import { v4 as UUID } from 'uuid';

describe('FileService', () => {
  let service: FileService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileService],
      imports: [
        ConfigModule,
        forwardRef(() => DatabaseModule),
        TypeOrmModule.forFeature([FileEntity]),
      ],
    }).compile();

    service = module.get<FileService>(FileService);
    connection = module.get<Connection>(Connection);
    await connection.getRepository(FileEntity).delete({});
  });

  it('on module init', async () => {
    expect(await service.onModuleInit()).toBeUndefined();
  });

  it('find by id & validate', async () => {
    const uuid = UUID();
    const file = await connection
      .getRepository(FileEntity)
      .save({ size: 0, uuid, uploadTime: new Date() });

    expect(await service.findById(file.id)).toEqual({
      ...file,
      uploadTime: expect.any(Date),
    });
    expect(await service.findById(-1)).toBeUndefined();

    expect(await service.validate(file.id)).toEqual(true);
    expect(await service.validate(-1)).toEqual(false);

    expect(await service.checkExistenceByUUID(uuid)).toEqual(true);
    expect(await service.checkExistenceByUUID('invalid')).toEqual(false);
  });

  it('delete file', async () => {
    const uuid = UUID();

    const file = await connection
      .getRepository(FileEntity)
      .save({ size: 0, uuid, uploadTime: new Date() });
    expect(await service.delete(file)).toBeUndefined();
    expect(await service.findById(file.id)).toEqual(null);

    await connection.getRepository(FileEntity).save(file);
    expect(await service.deleteById(-1)).toBeUndefined();
    expect(await service.findById(file.id)).toEqual({
      ...file,
      uploadTime: expect.any(Date),
    });
    expect(await service.deleteById(file.id)).toBeUndefined();
    expect(await service.findById(file.id)).toBeUndefined();
  });

  it('get file info', async () => {
    const uuid = UUID();
    const file = await connection
      .getRepository(FileEntity)
      .save({ size: 0, uuid, uploadTime: new Date() });

    expect(await service.getFileInfo(file)).toEqual({
      id: file.id,
      uuid,
      size: 0,
      uploadTime: expect.any(Date),
      downloadLink: expect.anything(),
    });
    expect(await service.getFileInfoById(-1)).toEqual(null);
    expect(await service.getFileInfoById(file.id)).toEqual({
      id: file.id,
      uuid,
      size: 0,
      uploadTime: expect.any(Date),
      downloadLink: expect.anything(),
    });
  });

  afterEach(async () => {
    await connection.getRepository(FileEntity).delete({});
  });

  afterAll(async () => await connection.close());
});
