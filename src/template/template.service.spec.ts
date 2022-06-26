import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './template.entity';
import { forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExamModule } from '../exam/exam.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { Connection } from 'typeorm';
import { TaskModule } from '../task/task.module';
import { CourseModule } from '../course/course.module';

describe('TemplateService', () => {
  let service: TemplateService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([TemplateEntity]),
        forwardRef(() => DatabaseModule),
        forwardRef(() => ExamModule),
        forwardRef(() => TaskModule),
        forwardRef(() => CourseModule),
        forwardRef(() => TagModule),
        forwardRef(() => UserModule),
      ],
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    connection = module.get<Connection>(Connection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    await connection.close();
  });
});
