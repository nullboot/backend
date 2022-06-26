import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TutorService } from './tutor.service';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from '../user/user.entity';
import { IntParam } from '../common/validators';
import { CurrentUser } from '../common/user.decorator';
import { TutorEntity } from './tutor.entity';
import { PermissionService } from '../permission/permission.service';
import { UserService } from '../user/user.service';
import {
  TraineeGetExamError,
  TraineeGetExamResponseDto,
  TraineeSubmitExamError,
  TraineeSubmitExamRequestDto,
  TraineeSubmitExamResponseDto,
} from '../exam/dto';
import { ExamService } from '../exam/exam.service';
import {
  TraineeGetTaskError,
  TraineeGetTaskResponseDto,
  TraineeSubmitTaskError,
  TraineeSubmitTaskResponseDto,
} from '../task/dto';
import { TaskService } from '../task/task.service';
import {
  TraineeGetCourseError,
  TraineeGetCourseResponseDto,
  TraineeSubmitCourseSectionError,
  TraineeSubmitCourseSectionResponseDto,
} from '../course/dto';
import { CourseService } from '../course/course.service';
import { Role } from '../common/role';

@ApiTags('ROLE::Tutor')
@ApiBearerAuth()
@Controller('tutor')
@UseGuards(AuthGuard('jwt'))
export class TutorTrainingController {
  constructor(
    private readonly tutorService: TutorService,
    private readonly userService: UserService,
    private readonly examService: ExamService,
    private readonly taskService: TaskService,
    private readonly courseService: CourseService,
    private readonly permissionService: PermissionService,
  ) {}

  async hasPermissionOnTutor(
    user: UserEntity,
    tutor: TutorEntity,
    role?: Role,
  ): Promise<boolean> {
    if (user.isRoot || user.id === tutor.userId) return true;
    return await this.permissionService.hasPermission(
      user,
      role ? role : undefined,
      tutor.user.divisionId,
    );
  }

  @Get(':id/training/exam/:examId')
  @ApiOperation({ summary: 'Get exam for tutor.' })
  async getTutorExam(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('examId') examId: number,
  ): Promise<TraineeGetExamResponseDto> {
    if (!currentUser) return { error: TraineeGetExamError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id, true);
    if (!tutor) return { error: TraineeGetExamError.NO_SUCH_TUTOR };
    if (!(await this.hasPermissionOnTutor(currentUser, tutor)))
      return { error: TraineeGetExamError.PERMISSION_DENIED };

    const training = tutor.training;
    if (!tutor.isApproved || !training)
      return { error: TraineeGetExamError.PERMISSION_DENIED };

    return await this.examService.getFromTraining(training, examId);
  }

  @Post(':id/training/exam/:examId')
  @ApiOperation({ summary: 'Submit exam for tutor.' })
  async submitTutorExam(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('examId') examId: number,
    @Body() body: TraineeSubmitExamRequestDto,
  ): Promise<TraineeSubmitExamResponseDto> {
    if (!currentUser)
      return { error: TraineeSubmitExamError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id);
    if (!tutor) return { error: TraineeSubmitExamError.NO_SUCH_TUTOR };
    // Nobody can submit exam except the tutor himself and ROOT (who can SU to everyone)
    if (tutor.userId !== currentUser.id && !currentUser.isRoot)
      return { error: TraineeSubmitExamError.PERMISSION_DENIED };

    const training = tutor.training;
    if (!tutor.isApproved || !training)
      return { error: TraineeSubmitExamError.PERMISSION_DENIED };

    return await this.examService.submitToTraining(
      training,
      examId,
      body.answers,
      (score) => this.tutorService.finishExam(tutor, examId, score),
    );
  }

  @Get(':id/training/task/:taskId')
  @ApiOperation({ summary: 'Get task for tutor.' })
  async getTutorTask(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('taskId') taskId: number,
  ): Promise<TraineeGetTaskResponseDto> {
    if (!currentUser) return { error: TraineeGetTaskError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id, true);
    if (!tutor) return { error: TraineeGetTaskError.NO_SUCH_TUTOR };
    if (!(await this.hasPermissionOnTutor(currentUser, tutor)))
      return { error: TraineeGetTaskError.PERMISSION_DENIED };

    const training = tutor.training;
    if (!tutor.isApproved || !training)
      return { error: TraineeGetTaskError.PERMISSION_DENIED };

    return await this.taskService.getFromTraining(training, taskId);
  }

  @Post(':id/training/task/:taskId')
  @ApiOperation({ summary: 'Submit task for tutor.' })
  async submitTutorTask(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('taskId') taskId: number,
  ): Promise<TraineeSubmitTaskResponseDto> {
    if (!currentUser)
      return { error: TraineeSubmitTaskError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id, true, true);
    if (!tutor) return { error: TraineeSubmitTaskError.NO_SUCH_TUTOR };
    // Nobody can submit task except the tutor himself and ROOT (who can SU to everyone)
    if (tutor.userId !== currentUser.id && !currentUser.isRoot)
      return { error: TraineeSubmitTaskError.PERMISSION_DENIED };

    const training = tutor.training;
    if (!tutor.isApproved || !training)
      return { error: TraineeSubmitTaskError.PERMISSION_DENIED };

    return await this.taskService.submitToTraining(training, taskId, () =>
      this.tutorService.finishTask(tutor, taskId),
    );
  }

  @Get(':id/training/course/:courseId')
  @ApiOperation({ summary: 'Get course for tutor.' })
  async getTutorCourse(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('courseId') courseId: number,
  ): Promise<TraineeGetCourseResponseDto> {
    if (!currentUser) return { error: TraineeGetCourseError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id);
    if (!tutor) return { error: TraineeGetCourseError.NO_SUCH_TUTOR };
    if (!(await this.hasPermissionOnTutor(currentUser, tutor)))
      return { error: TraineeGetCourseError.PERMISSION_DENIED };

    const training = tutor.training;
    if (!tutor.isApproved || !training)
      return { error: TraineeGetCourseError.PERMISSION_DENIED };

    return await this.courseService.getFromTraining(training, courseId);
  }

  @Post(':id/training/course/:courseId/section/:sectionId')
  @ApiOperation({ summary: 'Submit course section for tutor.' })
  async submitTutorCourseSection(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('courseId') courseId: number,
    @IntParam('sectionId') sectionId: number,
  ): Promise<TraineeSubmitCourseSectionResponseDto> {
    if (!currentUser)
      return { error: TraineeSubmitCourseSectionError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id);
    if (!tutor) return { error: TraineeSubmitCourseSectionError.NO_SUCH_TUTOR };
    // Nobody can submit course section except the tutor himself and ROOT (who can SU to everyone)
    if (tutor.userId !== currentUser.id && !currentUser.isRoot)
      return { error: TraineeSubmitCourseSectionError.PERMISSION_DENIED };

    const training = tutor.training;
    if (!tutor.isApproved || !training)
      return { error: TraineeSubmitCourseSectionError.PERMISSION_DENIED };

    return await this.courseService.submitToTraining(
      training,
      courseId,
      sectionId,
      () => this.tutorService.finishCourseSection(tutor, courseId, sectionId),
    );
  }
}
