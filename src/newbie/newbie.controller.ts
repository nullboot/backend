import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NewbieService } from './newbie.service';
import { CurrentUser } from '../common/user.decorator';
import { UserEntity } from '../user/user.entity';
import { IntParam } from '../common/validators';
import {
  AssignNewbieTutorError,
  AssignNewbieTutorRequestDto,
  AssignNewbieTutorResponseDto,
  GetNewbieDataShowError,
  GetNewbieDataShowRequestDto,
  GetNewbieDataShowResponseDto,
  GetNewbieProfileError,
  GetNewbieProfileResponseDto,
  GetNewbiesError,
  GetNewbiesRequestDto,
  GetNewbiesResponseDto,
  GetNewbieTemplateError,
  GetNewbieTemplateResponseDto,
  NewbieStatus,
  UpdateNewbieTemplateError,
  UpdateNewbieTemplateRequestDto,
  UpdateNewbieTemplateResponseDto,
} from './dto';
import { hasRole, hasRoleOrRoot, Role } from '../common/role';
import { ExamService } from '../exam/exam.service';
import { PermissionService } from '../permission/permission.service';
import { CityService } from '../tag/tag-city.service';
import { DivisionService } from '../tag/tag-division.service';
import { UserService } from '../user/user.service';
import { TaskService } from '../task/task.service';
import { TutorService } from '../tutor/tutor.service';
import { CourseService } from '../course/course.service';
import { TemplateService } from '../template/template.service';
import { differenceInMonths, endOfMonth, startOfMonth } from 'date-fns';
import { NewbieCommentService } from './newbie-comment.service';
import { NewbieCommentType } from './newbie-comment.entity';
import { WildcardType } from '../common/dto';

/*
 * Progress:
 *                (isAssigned)  (isGraduated)
 * pending -> preparing -> training -> graduated
 */
function statusToIsAssigned(status: NewbieStatus) {
  if ([NewbieStatus.training, NewbieStatus.graduated].includes(status))
    return true;
  if ([NewbieStatus.preparing, NewbieStatus.pending].includes(status))
    return false;
  return null;
}

function statusToIsGraduate(status: NewbieStatus) {
  if (status === NewbieStatus.graduated) return true;
  return status == null ? null : false;
}

@ApiTags('ROLE::Newbie')
@ApiBearerAuth()
@Controller('newbie')
@UseGuards(AuthGuard('jwt'))
export class NewbieController {
  constructor(
    private readonly newbieService: NewbieService,
    private readonly tutorService: TutorService,
    private readonly examService: ExamService,
    private readonly taskService: TaskService,
    private readonly courseService: CourseService,
    private readonly permissionService: PermissionService,
    private readonly cityService: CityService,
    private readonly divisionService: DivisionService,
    private readonly userService: UserService,
    private readonly templateService: TemplateService,
    private readonly newbieCommentService: NewbieCommentService,
  ) {}

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get the profile of a newbie.' })
  async getNewbieProfile(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
  ): Promise<GetNewbieProfileResponseDto> {
    if (!currentUser) return { error: GetNewbieProfileError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: GetNewbieProfileError.NO_SUCH_NEWBIE };
    if (!(await this.newbieService.hasPermission(currentUser, newbie)))
      return { error: GetNewbieProfileError.PERMISSION_DENIED };

    const showComment =
      currentUser.id === newbie.userId ||
      hasRoleOrRoot(currentUser, Role.ADMIN);

    return {
      profile: await this.newbieService.filterProfile(newbie, currentUser),
      training: newbie.training,
      comment: showComment
        ? await this.newbieCommentService.findOneByNewbieId(
            newbie.userId,
            NewbieCommentType.NewbieToTutor,
          )
        : undefined,
    };
  }

  @ApiTags('ROLE::Admin')
  @Post(':id/tutor')
  @ApiOperation({ summary: '[ADMIN] Assign a newbie to a graduated tutor.' })
  async assignNewbieTutor(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: AssignNewbieTutorRequestDto,
  ): Promise<AssignNewbieTutorResponseDto> {
    if (!currentUser)
      return { error: AssignNewbieTutorError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: AssignNewbieTutorError.NO_SUCH_NEWBIE };
    if (
      !(await this.newbieService.hasPrivilege(currentUser, newbie, Role.ADMIN))
    )
      return { error: AssignNewbieTutorError.PERMISSION_DENIED };
    if (newbie.isAssigned)
      return { error: AssignNewbieTutorError.NEWBIE_IS_ASSIGNED };

    const tutor = await this.tutorService.findByUserId(body.tutorId, true);
    if (!tutor) return { error: AssignNewbieTutorError.NO_SUCH_TUTOR };
    if (!(await this.tutorService.hasPrivilege(currentUser, tutor, Role.ADMIN)))
      return { error: AssignNewbieTutorError.PERMISSION_DENIED };
    if (!tutor.isGraduate)
      return { error: AssignNewbieTutorError.TUTOR_NOT_GRADUATE };

    await this.newbieService.assignTutor(newbie, tutor);

    return {
      profile: await this.newbieService.getProfileByUserId(
        newbie.userId,
        currentUser,
      ),
    };
  }

  @ApiTags('ROLE::Tutor')
  @Get(':id/template')
  @ApiOperation({ summary: 'Get training template of a newbie.' })
  async getNewbieTemplate(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
  ): Promise<GetNewbieTemplateResponseDto> {
    if (!currentUser)
      return { error: GetNewbieTemplateError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: GetNewbieTemplateError.NO_SUCH_NEWBIE };
    if (!(await this.newbieService.hasPermission(currentUser, newbie)))
      return { error: GetNewbieTemplateError.PERMISSION_DENIED };
    if (!newbie.tutorId)
      return { error: GetNewbieTemplateError.NO_TUTOR_ASSIGNED };

    return {
      template: await this.templateService.toResponseDto(
        this.newbieService.getTemplate(newbie),
      ),
    };
  }

  @ApiTags('ROLE::Tutor')
  @Post(':id/template')
  @ApiOperation({ summary: 'Update training template of a newbie.' })
  async updateNewbieTemplate(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: UpdateNewbieTemplateRequestDto,
  ): Promise<UpdateNewbieTemplateResponseDto> {
    if (!currentUser)
      return { error: UpdateNewbieTemplateError.PERMISSION_DENIED };
    let newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: UpdateNewbieTemplateError.NO_SUCH_NEWBIE };
    if (
      (!hasRole(currentUser, Role.TUTOR) ||
        currentUser.id !== newbie.tutorId) &&
      !(await this.newbieService.hasPrivilege(currentUser, newbie, Role.ADMIN))
    )
      return { error: UpdateNewbieTemplateError.PERMISSION_DENIED };

    if (!newbie.tutorId)
      return { error: UpdateNewbieTemplateError.NO_TUTOR_ASSIGNED };
    if (newbie.isAssigned)
      return { error: UpdateNewbieTemplateError.TRAINING_ASSIGNED };

    const [validateExams, validateTasks, validateCourses] = await Promise.all([
      this.examService.checkExistenceByIds(body.exams.map((e) => e.id)),
      this.taskService.checkExistenceByIds(body.tasks.map((t) => t.id)),
      this.courseService.checkExistenceByIds(body.courses.map((c) => c.id)),
    ]);
    if (!validateExams)
      return { error: UpdateNewbieTemplateError.INVALID_EXAM };
    if (!validateTasks)
      return { error: UpdateNewbieTemplateError.INVALID_TASK };
    if (!validateCourses)
      return { error: UpdateNewbieTemplateError.INVALID_COURSE };

    newbie = await this.newbieService.updateTemplate(newbie, body);

    return {
      template: await this.templateService.toResponseDto(
        this.newbieService.getTemplate(newbie),
      ),
    };
  }

  @ApiTags('LIST')
  @Get('')
  @ApiOperation({ summary: 'Get newbie list.' })
  async getNewbies(
    @CurrentUser() currentUser: UserEntity,
    @Query() query: GetNewbiesRequestDto,
  ): Promise<GetNewbiesResponseDto> {
    // validate permission
    function hasPermission(): boolean {
      const currentRole = query.currentRole;
      if (!currentUser) return false;
      if (currentUser.isRoot) return true;
      if (!hasRole(currentUser, currentRole)) return false;
      if ([Role.HRBP, Role.ADMIN].includes(currentRole)) return true;
      if (currentRole === Role.TUTOR) return currentUser.id === query.tutorId;
      return false;
    }

    if (!hasPermission()) return { error: GetNewbiesError.PERMISSION_DENIED };

    // validate query
    if (query.take > 100) return { error: GetNewbiesError.TAKE_TOO_MANY };
    let divisionIds = null;
    if (query.currentRole === Role.TUTOR && !currentUser.isRoot) {
      if (query.tutorId !== currentUser.id)
        return { error: GetNewbiesError.PERMISSION_DENIED };
      if (query.divisionId) {
        if (!(await this.divisionService.validate(query.divisionId)))
          return { error: GetNewbiesError.INVALID_DIVISION };
        divisionIds = [query.divisionId];
      }
    } else {
      divisionIds = await this.permissionService.filterPermissions(
        currentUser,
        query.currentRole,
        await this.divisionService.findById(query.divisionId),
      );
    }
    if (query.divisionId && divisionIds?.length === 0)
      return { error: GetNewbiesError.INVALID_DIVISION };
    if (query.cityId && !(await this.cityService.validate(query.cityId)))
      return { error: GetNewbiesError.INVALID_CITY };
    if (query.tutorId != null) {
      const tutor = await this.userService.findById(query.tutorId);
      if (!tutor || !tutor.roles.includes(Role.TUTOR))
        return { error: GetNewbiesError.NO_SUCH_TUTOR };
    }

    // get data
    const [list, count] = await this.newbieService.getList(
      query.skip,
      query.take,
      {
        cityId: query.cityId,
        divisionIds: divisionIds,
        searchRealname: query.keyword
          ? {
              keyword: query.keyword,
              wildcard: query.wildcard || WildcardType.END,
            }
          : undefined,
        tutorId: query.tutorId,
        isAssigned: statusToIsAssigned(query.status),
        isGraduate: statusToIsGraduate(query.status),
        noTutor: query.status === NewbieStatus.pending,
        pendingFirst: query.pendingFirst,
      },
    );

    return {
      newbies: await Promise.all(
        list.map((entity) =>
          this.newbieService.filterProfile(
            entity,
            currentUser,
            query.currentRole !== Role.TUTOR,
          ),
        ),
      ),
      comments: query.getComments
        ? await this.newbieCommentService.findByNewbieIds(
            list.map((entity) => entity.userId),
          )
        : undefined,
      count,
    };
  }

  @ApiTags('DATA-SHOW')
  @Get('data-show')
  @ApiOperation({ summary: 'Get data-show of newbie.' })
  async getNewbieDataShow(
    @CurrentUser() currentUser: UserEntity,
    @Query() query: GetNewbieDataShowRequestDto,
  ): Promise<GetNewbieDataShowResponseDto> {
    function hasPermission(): boolean {
      return (
        currentUser && (currentUser.isRoot || hasRole(currentUser, Role.ADMIN))
      );
    }

    if (!hasPermission())
      return { error: GetNewbieDataShowError.PERMISSION_DENIED };
    if (query.startTime == null || query.endTime == null)
      return { error: GetNewbieDataShowError.INVALID_TIME_RANGE };
    const timeRange = {
      startTime: startOfMonth(new Date(query.startTime)),
      endTime: endOfMonth(new Date(query.endTime)),
    };
    if (timeRange.startTime > timeRange.endTime)
      return { error: GetNewbieDataShowError.INVALID_TIME_RANGE };
    if (differenceInMonths(timeRange.startTime, timeRange.endTime) >= 12)
      return { error: GetNewbieDataShowError.TAKE_TOO_MANY_MONTHS };
    const divisionIds = currentUser.isRoot
      ? (await this.divisionService.getList()).map((division) => division.id)
      : await this.permissionService.filterPermissions(currentUser, Role.ADMIN);
    return await this.newbieService.getDataShow({ divisionIds, timeRange });
  }
}
