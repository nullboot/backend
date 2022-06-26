import { forwardRef, Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { UserModule } from '../user/user.module';
import { ExamEntity } from './exam.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamEntity]),
    forwardRef(() => UserModule),
  ],
  providers: [ExamService],
  exports: [ExamService],
  controllers: [ExamController],
})
export class ExamModule {}
