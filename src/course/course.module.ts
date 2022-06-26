import { forwardRef, Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseSectionService } from './course-section.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './course.entity';
import { CourseSectionEntity } from './course-section.entity';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEntity, CourseSectionEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => FileModule),
  ],
  controllers: [CourseController],
  exports: [CourseService],
  providers: [CourseService, CourseSectionService],
})
export class CourseModule {}
