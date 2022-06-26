import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NewbieModule } from './newbie/newbie.module';
import { TutorModule } from './tutor/tutor.module';
import { DevModule } from './dev/dev.module';
import { TagModule } from './tag/tag.module';
import { ExamModule } from './exam/exam.module';
import { TemplateModule } from './template/template.module';
import { TaskModule } from './task/task.module';
import { PermissionModule } from './permission/permission.module';
import { FileModule } from './file/file.module';
import { CourseModule } from './course/course.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => DevModule),
    forwardRef(() => DatabaseModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => NewbieModule),
    forwardRef(() => TutorModule),
    forwardRef(() => TagModule),
    forwardRef(() => ExamModule),
    forwardRef(() => CourseModule),
    forwardRef(() => TemplateModule),
    forwardRef(() => TaskModule),
    forwardRef(() => FileModule),
    forwardRef(() => PermissionModule),
  ],
})
export class AppModule {}
