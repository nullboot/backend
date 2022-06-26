import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TemplateContent,
  TemplateEntity,
  TemplateType,
  toTemplateContent,
} from './template.entity';
import { Repository } from 'typeorm';
import {
  TemplateBriefResponseDto,
  TemplateRequestDto,
  TemplateResponseDto,
} from './dto';
import { UserService } from '../user/user.service';
import { ExamService } from '../exam/exam.service';
import { TaskService } from '../task/task.service';
import { DivisionService } from '../tag/tag-division.service';
import { CityService } from '../tag/tag-city.service';
import { DivisionEntity } from '../tag/tag-division.entity';
import { CourseService } from '../course/course.service';
import { TrainingDto } from '../common/dto';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ExamService))
    private readonly examService: ExamService,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
    @Inject(forwardRef(() => CourseService))
    private readonly courseService: CourseService,
    @Inject(forwardRef(() => DivisionService))
    private readonly divisionService: DivisionService,
    @Inject(forwardRef(() => CityService))
    private readonly cityService: CityService,
  ) {}

  async findByTypeAndId(
    type: TemplateType,
    id: number,
    loadDivision = false,
  ): Promise<TemplateEntity> {
    const query = this.templateRepository.createQueryBuilder('template');
    if (loadDivision) query.leftJoinAndSelect('template.division', 'division');
    return await query
      .where('template.type = :type', { type })
      .andWhere('template.divisionId = :divisionId', { divisionId: id })
      .getOne();
  }

  async toBriefResponseDto(
    template: TemplateEntity,
  ): Promise<TemplateBriefResponseDto> {
    return {
      division: template.division
        ? DivisionService.toDto(template.division)
        : await this.divisionService.getDtoById(template.divisionId),
      type: template.type,
      examCount: template.content.exams.length,
      taskCount: template.content.tasks.length,
      courseCount: template.content.courses.length,
    };
  }

  async toResponseDto(template: TemplateEntity): Promise<TemplateResponseDto> {
    return {
      division: template.division
        ? DivisionService.toDto(template.division)
        : await this.divisionService.getDtoById(template.divisionId),
      type: template.type,
      exams: await this.examService.toTemplateExamResponseDto(
        template.content.exams,
      ),
      tasks: await this.taskService.toTemplateTaskResponseDto(
        template.content.tasks,
      ),
      courses: await this.courseService.toTemplateCourseResponseDto(
        template.content.courses,
      ),
    };
  }

  async toTraining(content: TemplateContent): Promise<TrainingDto> {
    if (!content) return null;
    return {
      tasks: content.tasks.map((task) => ({
        ...task,
        finished: false,
      })),
      exams: content.exams.map((exam) => ({
        ...exam,
        finished: false,
        score: 0,
      })),
      courses: await Promise.all(
        content.courses.map((course) =>
          this.courseService.toTrainingCourseDto(course),
        ),
      ),
    };
  }

  async create(
    type: TemplateType,
    division: DivisionEntity,
  ): Promise<TemplateEntity> {
    return await this.templateRepository.save({
      content: toTemplateContent([], [], []),
      type,
      divisionId: division.id,
    });
  }

  async update(
    template: TemplateEntity,
    body: TemplateRequestDto,
  ): Promise<TemplateEntity> {
    template.content = toTemplateContent(body.exams, body.tasks, body.courses);
    await Promise.all([
      this.examService.markAsUsed(body.exams.map((exam) => exam.id)),
      this.taskService.markAsUsed(body.tasks.map((task) => task.id)),
      this.courseService.markAsUsed(body.courses.map((course) => course.id)),
    ]);
    return await this.templateRepository.save(template);
  }

  async getList(
    skip: number,
    take: number,
    type: TemplateType,
    divisionIds?: number[],
  ): Promise<[list: TemplateEntity[], count: number]> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .skip(skip || 0)
      .take(take)
      .where('template.type = :type', { type });

    if (divisionIds) {
      if (divisionIds.length === 1)
        query.andWhere('template.divisionId = :divisionId', {
          divisionId: divisionIds[0],
        });
      else if (divisionIds.length > 1)
        query.andWhere('template.divisionId IN (:...divisionIds)', {
          divisionIds,
        });
    }

    return await query.getManyAndCount();
  }
}
