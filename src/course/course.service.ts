import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CourseEntity } from './course.entity';
import { In, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { CourseSectionService } from './course-section.service';
import { UserEntity } from '../user/user.entity';
import {
  CourseBriefDto,
  CourseDto,
  CourseForTraineeDto,
  CourseRequestDto,
  TraineeGetCourseError,
  TraineeGetCourseResponseDto,
  TraineeSubmitCourseSectionError,
  TraineeSubmitCourseSectionResponseDto,
} from './dto';
import { TrainingDto, TrainingCourseDto, WildcardType } from '../common/dto';
import {
  TemplateCourseRequestDto,
  TemplateCourseResponseDto,
} from '../template/dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => CourseSectionService))
    private readonly courseSectionService: CourseSectionService,
  ) {}

  async findById(id: number, loadOwner = false): Promise<CourseEntity> {
    const query = this.courseRepository.createQueryBuilder('course');
    if (loadOwner) query.leftJoinAndSelect('course.owner', 'owner');
    query.where('course.id = :courseId', { courseId: id });
    return await query.getOne();
  }

  async findByIds(ids: number[]): Promise<Map<number, CourseEntity>> {
    if (ids.length === 0) return new Map();
    const query = this.courseRepository.createQueryBuilder('course');
    query.where('course.id IN (:...courseIds)', { courseIds: ids });
    const list = await query.getMany();
    return new Map(list.map((c) => [c.id, c]));
  }

  async toDto(
    course: CourseEntity,
    currentUser: UserEntity,
    customTags?: string[],
  ): Promise<CourseDto> {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      tags: customTags != null ? customTags : course.tags,
      isUsed: course.isUsed,
      ownerProfile:
        course.ownerId != null
          ? course.owner
            ? await this.userService.filterProfile(course.owner, currentUser)
            : await this.userService.getProfileById(course.ownerId, currentUser)
          : null,
      sections: await this.courseSectionService.getDtoByIds(course.sectionIds),
    };
  }

  async toBriefDto(
    course: CourseEntity,
    currentUser: UserEntity,
  ): Promise<CourseBriefDto> {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      tags: course.tags,
      isUsed: course.isUsed,
      ownerProfile: course.ownerId
        ? course.owner
          ? await this.userService.filterProfile(course.owner, currentUser)
          : await this.userService.getProfileById(course.ownerId, currentUser)
        : null,
      sectionCount: course.sectionIds.length,
    };
  }

  async create(
    body: CourseRequestDto,
    owner: UserEntity,
  ): Promise<CourseEntity> {
    return await this.courseRepository.save({
      title: body.title,
      description: body.description,
      tags: body.tags,
      sectionIds: body.sectionIds,
      owner,
    });
  }

  async delete(course: CourseEntity): Promise<void> {
    await this.courseRepository.remove(course);
  }

  async update(
    course: CourseEntity,
    body: CourseRequestDto,
  ): Promise<CourseEntity> {
    course.title = body.title;
    course.description = body.description;
    course.tags = body.tags;
    course.sectionIds = body.sectionIds;
    await this.courseSectionService.markAsUsed(course.sectionIds);
    return await this.courseRepository.save(course);
  }

  async getList(
    skip: number,
    take: number,
    {
      search,
      ownerId,
      tag,
    }: {
      search?: { keyword: string; wildcard?: WildcardType };
      ownerId?: number;
      tag?: string;
    } = {},
  ): Promise<[list: CourseEntity[], count: number]> {
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.owner', 'owner')
      .skip(skip)
      .take(take);
    if (search) {
      if (search.wildcard === WildcardType.NONE)
        query.andWhere('course.title = :keyword', { keyword: search.keyword });
      else {
        let keyword = search.keyword;
        if (search.wildcard === WildcardType.BOTH) keyword = `%${keyword}%`;
        else if (search.wildcard === WildcardType.BEGIN)
          keyword = `%${keyword}`;
        else if (search.wildcard === WildcardType.END) keyword = `${keyword}%`;
        query.andWhere('course.title LIKE :keyword', { keyword });
      }
    }
    if (ownerId != null)
      query.andWhere('course.ownerId = :ownerId', { ownerId });
    if (tag != null) query.andWhere(`JSON_CONTAINS(course.tags, '"${tag}"')`);

    return await query.getManyAndCount();
  }

  async checkExistenceByIds(ids: number[]): Promise<boolean> {
    return (await this.courseRepository.count({ id: In(ids) })) === ids.length;
  }

  async toTemplateCourseResponseDto(
    courses: TemplateCourseRequestDto[],
  ): Promise<TemplateCourseResponseDto[]> {
    const list = await this.courseRepository.findByIds(
      courses.map((course) => course.id),
    );
    return list.map((course, index) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      tags: courses[index].tags,
      isOptional: courses[index].isOptional,
      day: courses[index].day,
    }));
  }

  private async toDtoForTrainee(
    course: CourseEntity,
    trainingCourse: TrainingCourseDto,
  ): Promise<CourseForTraineeDto> {
    return {
      title: course.title,
      description: course.description,
      tags: trainingCourse.tags || course.tags,
      day: trainingCourse.day,
      isOptional: trainingCourse.isOptional,
      finished: trainingCourse.finished,
      sections: await this.courseSectionService.getDtoForTraineeByIds(
        trainingCourse.sections,
      ),
    };
  }

  async getSectionCountByIds(ids: number[]): Promise<number[]> {
    const map = await this.findByIds(ids);
    return ids.map((id) => map.get(id).sectionIds.length);
  }

  async getFromTraining(
    training: TrainingDto,
    courseId: number,
  ): Promise<TraineeGetCourseResponseDto> {
    const courses = training.courses;
    if (courseId < 0 || courseId >= courses.length)
      return { error: TraineeGetCourseError.NO_SUCH_COURSE };
    const course = await this.findById(courses[courseId].id);
    if (!course) return { error: TraineeGetCourseError.NO_SUCH_COURSE };

    return {
      course: await this.toDtoForTrainee(course, courses[courseId]),
    };
  }

  async submitToTraining(
    training: TrainingDto,
    courseId: number,
    sectionId: number,
    onSuccess?: () => Promise<any>,
  ): Promise<TraineeSubmitCourseSectionResponseDto> {
    const courses = training.courses;
    if (courseId < 0 || courseId >= courses.length)
      return { error: TraineeSubmitCourseSectionError.NO_SUCH_COURSE };
    const course = await this.findById(courses[courseId].id);
    if (!course)
      return { error: TraineeSubmitCourseSectionError.NO_SUCH_COURSE };
    const sections = course.sectionIds;
    if (sectionId < 0 || sectionId >= sections.length)
      return { error: TraineeSubmitCourseSectionError.NO_SUCH_SECTION };
    const section = await this.courseSectionService.findById(
      sections[sectionId],
    );
    if (!section)
      return { error: TraineeSubmitCourseSectionError.NO_SUCH_SECTION };

    if (onSuccess != null) await onSuccess();

    return {};
  }

  async toTrainingCourseDto(
    templateCourse: TemplateCourseRequestDto,
  ): Promise<TrainingCourseDto> {
    const course = await this.findById(templateCourse.id);
    return {
      ...templateCourse,
      finished: false,
      sections: course.sectionIds.map((id) => ({ id, finished: false })),
    };
  }

  async markAsUsed(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const res = await this.courseRepository.update(
      { id: In(ids) },
      { isUsed: true },
    );
    if (res.affected !== ids.length)
      Logger.error(
        `Only Mark ${res.affected} of ${ids.length} as used.`,
        'CourseService',
      );
    return;
  }
}
