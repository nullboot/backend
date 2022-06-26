import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewbieService } from './newbie.service';
import { ExamService } from '../exam/exam.service';
import { TaskService } from '../task/task.service';
import { CourseService } from '../course/course.service';
import { CurrentUser } from '../common/user.decorator';
import { UserEntity } from '../user/user.entity';
import { IntParam } from '../common/validators';
import {
  TraineeGetExamError,
  TraineeGetExamResponseDto,
  TraineeSubmitExamError,
  TraineeSubmitExamRequestDto,
  TraineeSubmitExamResponseDto,
} from '../exam/dto';
import {
  TraineeGetTaskError,
  TraineeGetTaskResponseDto,
  TraineeSubmitTaskError,
  TraineeSubmitTaskResponseDto,
} from '../task/dto';
import {
  TraineeGetCourseError,
  TraineeGetCourseResponseDto,
  TraineeSubmitCourseSectionError,
  TraineeSubmitCourseSectionResponseDto,
} from '../course/dto';

@ApiTags('ROLE::Newbie', 'TRAINING')
@ApiBearerAuth()
@Controller('newbie')
@UseGuards(AuthGuard('jwt'))
export class NewbieTrainingController {
  constructor(
    private readonly newbieService: NewbieService,
    private readonly examService: ExamService,
    private readonly taskService: TaskService,
    private readonly courseService: CourseService,
  ) {}

  @Get(':id/training/exam/:examId')
  @ApiOperation({ summary: 'Get exam for newbie.' })
  async getNewbieExam(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('examId') examId: number,
  ): Promise<TraineeGetExamResponseDto> {
    if (!currentUser) return { error: TraineeGetExamError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: TraineeGetExamError.NO_SUCH_NEWBIE };
    if (!(await this.newbieService.hasPermission(currentUser, newbie)))
      return { error: TraineeGetExamError.PERMISSION_DENIED };

    const training = newbie.training;
    if (!newbie.isAssigned || !training)
      return { error: TraineeGetExamError.PERMISSION_DENIED };

    return await this.examService.getFromTraining(training, examId);
  }

  @Post(':id/training/exam/:examId')
  @ApiOperation({ summary: 'Submit exam for newbie.' })
  async submitNewbieExam(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('examId') examId: number,
    @Body() body: TraineeSubmitExamRequestDto,
  ): Promise<TraineeSubmitExamResponseDto> {
    if (!currentUser)
      return { error: TraineeSubmitExamError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id);
    if (!newbie) return { error: TraineeSubmitExamError.NO_SUCH_NEWBIE };
    // Nobody can submit exam except the newbie himself and ROOT (who can SU to everyone)
    if (newbie.userId !== currentUser.id && !currentUser.isRoot)
      return { error: TraineeSubmitExamError.PERMISSION_DENIED };

    const training = newbie.training;
    if (!newbie.isAssigned || !training)
      return { error: TraineeSubmitExamError.PERMISSION_DENIED };

    return await this.examService.submitToTraining(
      training,
      examId,
      body.answers,
      (score) => this.newbieService.finishExam(newbie, examId, score),
    );
  }

  @Get(':id/training/task/:taskId')
  @ApiOperation({ summary: 'Get task for newbie.' })
  async getNewbieTask(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('taskId') taskId: number,
  ): Promise<TraineeGetTaskResponseDto> {
    if (!currentUser) return { error: TraineeGetTaskError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: TraineeGetTaskError.NO_SUCH_NEWBIE };
    if (!(await this.newbieService.hasPermission(currentUser, newbie)))
      return { error: TraineeGetTaskError.PERMISSION_DENIED };

    const training = newbie.training;
    if (!newbie.isAssigned || !training)
      return { error: TraineeGetTaskError.PERMISSION_DENIED };

    return await this.taskService.getFromTraining(training, taskId);
  }

  @Post(':id/training/task/:taskId')
  @ApiOperation({ summary: 'Submit task for newbie.' })
  async submitNewbieTask(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('taskId') taskId: number,
  ): Promise<TraineeSubmitTaskResponseDto> {
    if (!currentUser)
      return { error: TraineeSubmitTaskError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true, true);
    if (!newbie) return { error: TraineeSubmitTaskError.NO_SUCH_NEWBIE };
    // Nobody can submit task except the newbie himself and ROOT (who can SU to everyone)
    if (newbie.userId !== currentUser.id && !currentUser.isRoot)
      return { error: TraineeSubmitTaskError.PERMISSION_DENIED };

    const training = newbie.training;
    if (!newbie.isAssigned || !training)
      return { error: TraineeSubmitTaskError.PERMISSION_DENIED };

    return await this.taskService.submitToTraining(training, taskId, () =>
      this.newbieService.finishTask(newbie, taskId),
    );
  }

  @Get(':id/training/course/:courseId')
  @ApiOperation({ summary: 'Get course for newbie.' })
  async getNewbieCourse(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('courseId') courseId: number,
  ): Promise<TraineeGetCourseResponseDto> {
    if (!currentUser) return { error: TraineeGetCourseError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id);
    if (!newbie) return { error: TraineeGetCourseError.NO_SUCH_NEWBIE };
    if (!(await this.newbieService.hasPermission(currentUser, newbie)))
      return { error: TraineeGetCourseError.PERMISSION_DENIED };

    const training = newbie.training;
    if (!newbie.isAssigned || !training)
      return { error: TraineeGetCourseError.PERMISSION_DENIED };

    return await this.courseService.getFromTraining(training, courseId);
  }

  @Post(':id/training/course/:courseId/section/:sectionId')
  @ApiOperation({ summary: 'Submit course section for newbie.' })
  async submitNewbieCourseSection(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('courseId') courseId: number,
    @IntParam('sectionId') sectionId: number,
  ): Promise<TraineeSubmitCourseSectionResponseDto> {
    if (!currentUser)
      return { error: TraineeSubmitCourseSectionError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id);
    if (!newbie)
      return { error: TraineeSubmitCourseSectionError.NO_SUCH_NEWBIE };
    // Nobody can submit course section except the newbie himself and ROOT (who can SU to everyone)
    if (newbie.userId !== currentUser.id && !currentUser.isRoot)
      return { error: TraineeSubmitCourseSectionError.PERMISSION_DENIED };

    const training = newbie.training;
    if (!newbie.isAssigned || !training)
      return { error: TraineeSubmitCourseSectionError.PERMISSION_DENIED };

    return await this.courseService.submitToTraining(
      training,
      courseId,
      sectionId,
      () => this.newbieService.finishCourseSection(newbie, courseId, sectionId),
    );
  }
}
