import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CourseService } from './course.service';
import { CourseSectionService } from './course-section.service';
import { CurrentUser } from '../common/user.decorator';
import { IntParam } from '../common/validators';
import { hasRoleOrRoot, Role } from '../common/role';
import {
  CourseRequestDto,
  CourseSectionRequestDto,
  CreateCourseError,
  CreateCourseResponseDto,
  DeleteCourseError,
  DeleteCourseResponseDto,
  DeleteCourseSectionError,
  DeleteCourseSectionResponseDto,
  GetCourseError,
  GetCourseResponseDto,
  GetCourseSectionsRequestDto,
  GetCourseSectionsResponseDto,
  GetCoursesError,
  GetCoursesRequestDto,
  GetCoursesResponseDto,
  UpdateCourseError,
  UpdateCourseResponseDto,
  UpdateCourseSectionError,
  UpdateCourseSectionResponseDto,
  CreateCourseSectionError,
  CreateCourseSectionResponseDto,
  GetCourseSectionError,
  GetCourseSectionResponseDto,
} from './dto';
import { DefaultPaginateError } from '../common/types';
import { FileService } from '../file/file.service';
import { WildcardType } from '../common/dto';

@ApiTags('TRAINING::Course')
@ApiBearerAuth()
@Controller('course')
@UseGuards(AuthGuard('jwt'))
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly courseSectionService: CourseSectionService,
    private readonly fileService: FileService,
  ) {}

  @ApiTags('LIST')
  @Get('section')
  @ApiOperation({
    summary: '获取课程章节列表',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getCourseSections(
    @CurrentUser() currentUser,
    @Query() req: GetCourseSectionsRequestDto,
  ): Promise<GetCourseSectionsResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: DefaultPaginateError.PERMISSION_DENIED };

    if (req.take > 100) return { error: DefaultPaginateError.TAKE_TOO_MANY };

    const [list, count] = await this.courseSectionService.getList(
      req.skip,
      req.take,
      {
        search: req.keyword
          ? {
              keyword: req.keyword,
              wildcard: req.wildcard || WildcardType.BOTH,
            }
          : undefined,
        type: req.type,
      },
    );

    return {
      sections: await Promise.all(
        list.map((section) => this.courseSectionService.toDto(section)),
      ),
      count,
    };
  }

  @ApiTags('LIST')
  @Get('')
  @ApiOperation({
    summary: '获取课程列表',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getCourses(
    @CurrentUser() currentUser,
    @Query() req: GetCoursesRequestDto,
  ): Promise<GetCoursesResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetCoursesError.PERMISSION_DENIED };

    if (req.take > 100) return { error: GetCoursesError.TAKE_TOO_MANY };

    const [list, count] = await this.courseService.getList(req.skip, req.take, {
      search: req.keyword
        ? { keyword: req.keyword, wildcard: req.wildcard || WildcardType.BOTH }
        : undefined,
      ownerId: req.ownerId,
      tag: req.tag,
    });

    return {
      courses: await Promise.all(
        list.map((course) =>
          this.courseService.toBriefDto(course, currentUser),
        ),
      ),
      count,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取课程信息',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getCourse(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<GetCourseResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetCourseError.PERMISSION_DENIED };

    const course = await this.courseService.findById(id, true);
    if (!course) return { error: GetCourseError.NO_SUCH_COURSE };

    return { course: await this.courseService.toDto(course, currentUser) };
  }

  @Post('new')
  @ApiOperation({
    summary: '创建课程',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async createCourse(
    @CurrentUser() currentUser,
    @Body() body: CourseRequestDto,
  ): Promise<CreateCourseResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: CreateCourseError.PERMISSION_DENIED };

    if (!(await this.courseSectionService.checkExistenceByIds(body.sectionIds)))
      return { error: CreateCourseError.INVALID_SECTION };

    const course = await this.courseService.create(body, currentUser);

    return { course: await this.courseService.toDto(course, currentUser) };
  }

  @Post(':id')
  @ApiOperation({
    summary: '更新课程信息',
    description: '只有 ADMIN 和 ROOT 具有权限；ADMIN 只能更新自己创建的课程',
  })
  async updateCourse(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
    @Body() body: CourseRequestDto,
  ): Promise<UpdateCourseResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: UpdateCourseError.PERMISSION_DENIED };
    let course = await this.courseService.findById(id);
    if (!course) return { error: UpdateCourseError.NO_SUCH_COURSE };
    if (currentUser.id !== course.ownerId && !currentUser.isRoot)
      return { error: UpdateCourseError.PERMISSION_DENIED };

    if (!(await this.courseSectionService.checkExistenceByIds(body.sectionIds)))
      return { error: UpdateCourseError.INVALID_SECTION };

    course = await this.courseService.update(course, body);
    return { course: await this.courseService.toDto(course, currentUser) };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除课程',
    description:
      '只有 ADMIN 和 ROOT 具有权限；课程未被使用时才能删除；ADMIN 只能删除自己创建的课程',
  })
  async deleteCourse(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<DeleteCourseResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: DeleteCourseError.PERMISSION_DENIED };
    const course = await this.courseService.findById(id);
    if (!course) return { error: DeleteCourseError.NO_SUCH_COURSE };
    if (currentUser.id !== course.ownerId && !currentUser.isRoot)
      return { error: DeleteCourseError.PERMISSION_DENIED };
    if (course.isUsed) return { error: DeleteCourseError.ALREADY_USED };

    await this.courseService.delete(course);
    return {};
  }

  @Post('section/new')
  @ApiOperation({
    summary: '创建课程章节',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async createCourseSection(
    @CurrentUser() currentUser,
    @Body() body: CourseSectionRequestDto,
  ): Promise<CreateCourseSectionResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: CreateCourseSectionError.PERMISSION_DENIED };
    if (!(await this.fileService.validate(body.fileId)))
      return { error: CreateCourseSectionError.NO_SUCH_FILE };

    const section = await this.courseSectionService.create(body);

    return { section: await this.courseSectionService.toDto(section) };
  }

  @Get('section/:id')
  @ApiOperation({
    summary: '获取课程章节信息',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getCourseSection(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<GetCourseSectionResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetCourseSectionError.PERMISSION_DENIED };

    const section = await this.courseSectionService.findById(id);
    if (!section) return { error: GetCourseSectionError.NO_SUCH_SECTION };

    return { section: await this.courseSectionService.toDto(section) };
  }

  @Post('section/:id')
  @ApiOperation({
    summary: '更新课程章节信息',
    description:
      '只有 ADMIN 和 ROOT 具有权限；ADMIN 只能更新自己创建的课程章节',
  })
  async updateCourseSection(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
    @Body() body: CourseSectionRequestDto,
  ): Promise<UpdateCourseSectionResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: UpdateCourseSectionError.PERMISSION_DENIED };
    if (!(await this.fileService.validate(body.fileId)))
      return { error: UpdateCourseSectionError.NO_SUCH_FILE };

    const section = await this.courseSectionService.findById(id);
    if (!section) return { error: UpdateCourseSectionError.NO_SUCH_SECTION };

    await this.courseSectionService.update(section, body);

    return { section: await this.courseSectionService.toDto(section) };
  }

  @Delete('section/:id')
  @ApiOperation({
    summary: '删除课程章节',
    description:
      '只有 ADMIN 和 ROOT 具有权限；ADMIN 只能删除自己创建的课程章节；**警告**：删除已被使用的课程章节将会导致严重错误',
  })
  async deleteCourseSection(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<DeleteCourseSectionResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: DeleteCourseSectionError.PERMISSION_DENIED };

    const section = await this.courseSectionService.findById(id);
    if (!section) return { error: DeleteCourseSectionError.NO_SUCH_SECTION };
    if (section.isUsed) return { error: DeleteCourseSectionError.ALREADY_USED };

    await this.courseSectionService.delete(section);
    return {};
  }
}
