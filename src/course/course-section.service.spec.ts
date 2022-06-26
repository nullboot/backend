import { Test, TestingModule } from '@nestjs/testing';
import { CourseSectionService } from './course-section.service';
import { ConfigModule } from '../config/config.module';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseSectionEntity } from './course-section.entity';
import { FileModule } from '../file/file.module';
import { Connection } from 'typeorm';

describe('CourseSectionService', () => {
  let service: CourseSectionService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        forwardRef(() => DatabaseModule),
        TypeOrmModule.forFeature([CourseSectionEntity]),
        forwardRef(() => FileModule),
      ],
      providers: [CourseSectionService],
    }).compile();

    service = module.get<CourseSectionService>(CourseSectionService);
    connection = module.get<Connection>(Connection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    await connection.close();
  });
});
