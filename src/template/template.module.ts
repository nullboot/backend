import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './template.entity';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { UserModule } from '../user/user.module';
import { ExamModule } from '../exam/exam.module';
import { TagModule } from '../tag/tag.module';
import { TaskModule } from '../task/task.module';
import { PermissionModule } from '../permission/permission.module';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => ExamModule),
    forwardRef(() => TaskModule),
    forwardRef(() => CourseModule),
    forwardRef(() => TagModule),
    forwardRef(() => PermissionModule),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
