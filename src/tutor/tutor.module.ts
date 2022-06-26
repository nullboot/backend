import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { TutorEntity } from './tutor.entity';
import { UserModule } from '../user/user.module';
import { PermissionModule } from '../permission/permission.module';
import { TagModule } from '../tag/tag.module';
import { TemplateModule } from '../template/template.module';
import { TaskModule } from '../task/task.module';
import { CourseModule } from '../course/course.module';
import { ExamModule } from '../exam/exam.module';
import { NewbieModule } from '../newbie/newbie.module';
import { TutorAwardService } from './tutur-award.service';
import { TutorAwardEntity } from './tutor-award.entity';
import { TutorTrainingController } from './tutor-training.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorEntity, TutorAwardEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => TaskModule),
    forwardRef(() => ExamModule),
    forwardRef(() => CourseModule),
    forwardRef(() => PermissionModule),
    forwardRef(() => TagModule),
    forwardRef(() => TemplateModule),
    forwardRef(() => NewbieModule),
  ],
  providers: [TutorService, TutorAwardService],
  controllers: [TutorController, TutorTrainingController],
  exports: [TutorService, TutorAwardService],
})
export class TutorModule {}
