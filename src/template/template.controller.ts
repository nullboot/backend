import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TemplateService } from './template.service';
import { IntParam } from '../common/validators';
import { CurrentUser } from '../common/user.decorator';
import { hasRoleOrRoot, Role } from '../common/role';
import {
  GetTemplateError,
  GetTemplateResponseDto,
  GetTemplatesError,
  GetTemplatesRequestDto,
  GetTemplatesResponseDto,
  TemplateRequestDto,
  UpdateTemplateError,
  UpdateTemplateResponseDto,
} from './dto';
import { ExamService } from '../exam/exam.service';
import { TaskService } from '../task/task.service';
import { TemplateType } from './template.entity';
import { PermissionService } from '../permission/permission.service';
import { DivisionEntity } from '../tag/tag-division.entity';
import { CourseService } from '../course/course.service';

@ApiTags('TRAINING::Template')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('template')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly examService: ExamService,
    private readonly taskService: TaskService,
    private readonly courseService: CourseService,
    private readonly permissionService: PermissionService,
  ) {}

  @Get(':type/:id')
  @ApiParam({ name: 'id', description: '部门Id' })
  @ApiParam({
    name: 'type',
    enum: TemplateType,
    description: '模板类型（新人|导师）',
  })
  @ApiOperation({ summary: 'Get template.' })
  async getTemplate(
    @CurrentUser() currentUser,
    @Param('type') type: TemplateType,
    @IntParam('id') id: number,
  ): Promise<GetTemplateResponseDto> {
    if (
      !(await this.permissionService.hasPermission(currentUser, Role.ADMIN, id))
    )
      return { error: GetTemplateError.PERMISSION_DENIED };
    const template = await this.templateService.findByTypeAndId(type, id);
    if (!template) return { error: GetTemplateError.NO_SUCH_TEMPLATE };

    return {
      template: await this.templateService.toResponseDto(template),
    };
  }

  @Post(':type/:id')
  @ApiParam({ name: 'id', description: '部门Id' })
  @ApiParam({
    name: 'type',
    enum: TemplateType,
    description: '模板类型（新人|导师）',
  })
  @ApiOperation({ summary: 'Update template.' })
  async updateTemplate(
    @CurrentUser() currentUser,
    @Param('type') type: TemplateType,
    @IntParam('id') id: number,
    @Body() body: TemplateRequestDto,
  ): Promise<UpdateTemplateResponseDto> {
    if (
      !(await this.permissionService.hasPermission(currentUser, Role.ADMIN, id))
    )
      return { error: UpdateTemplateError.PERMISSION_DENIED };
    let template = await this.templateService.findByTypeAndId(type, id);
    if (!template) return { error: UpdateTemplateError.NO_SUCH_TEMPLATE };

    const [validateExams, validateTasks, validateCourses] = await Promise.all([
      this.examService.checkExistenceByIds(body.exams.map((e) => e.id)),
      this.taskService.checkExistenceByIds(body.tasks.map((t) => t.id)),
      this.courseService.checkExistenceByIds(body.courses.map((c) => c.id)),
    ]);
    if (!validateExams) return { error: UpdateTemplateError.INVALID_EXAM };
    if (!validateTasks) return { error: UpdateTemplateError.INVALID_TASK };
    if (!validateCourses) return { error: UpdateTemplateError.INVALID_COURSE };

    template = await this.templateService.update(template, body);

    return {
      template: await this.templateService.toResponseDto(template),
    };
  }

  @Get(':type')
  @ApiParam({
    name: 'type',
    enum: TemplateType,
    description: '模板类型（新人|导师）',
  })
  @ApiOperation({ summary: 'Get template list.' })
  async getTemplates(
    @CurrentUser() currentUser,
    @Param('type') type: TemplateType,
    @Query() req: GetTemplatesRequestDto,
  ): Promise<GetTemplatesResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetTemplatesError.PERMISSION_DENIED };

    if (req.take > 100) return { error: GetTemplatesError.TAKE_TOO_MANY };
    let divisions: DivisionEntity[] = null;
    if (!currentUser.isRoot)
      divisions = await this.permissionService.getPermissions(
        currentUser,
        Role.ADMIN,
      );

    const [list, count] = await this.templateService.getList(
      req.skip,
      req.take,
      type,
      divisions?.map((d) => d.id),
    );

    return {
      templates: await Promise.all(
        list.map((entity) => this.templateService.toBriefResponseDto(entity)),
      ),
      count,
    };
  }
}
