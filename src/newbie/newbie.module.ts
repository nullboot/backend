import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewbieService } from './newbie.service';
import { NewbieEntity } from './newbie.entity';
import { NewbieController } from './newbie.controller';
import { UserModule } from '../user/user.module';
import { TutorModule } from '../tutor/tutor.module';
import { ExamModule } from '../exam/exam.module';
import { PermissionModule } from '../permission/permission.module';
import { TagModule } from '../tag/tag.module';
import { TemplateModule } from '../template/template.module';
import { TaskModule } from '../task/task.module';
import { CourseModule } from '../course/course.module';
import { NewbieCommentService } from './newbie-comment.service';
import { NewbieCommentEntity } from './newbie-comment.entity';
import { NewbieCommentController } from './newbie-comment.controller';
import { NewbieTrainingController } from './newbie-training.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewbieEntity, NewbieCommentEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => TutorModule),
    forwardRef(() => ExamModule),
    forwardRef(() => TaskModule),
    forwardRef(() => CourseModule),
    forwardRef(() => PermissionModule),
    forwardRef(() => TagModule),
    forwardRef(() => TemplateModule),
  ],
  providers: [NewbieService, NewbieCommentService],
  controllers: [
    NewbieController,
    NewbieCommentController,
    NewbieTrainingController,
  ],
  exports: [NewbieService, NewbieCommentService],
})
export class NewbieModule {}
