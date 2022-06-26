import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TrainingDto } from '../common/dto';
import {
  TemplateCourseRequestDto,
  TemplateExamRequestDto,
  TemplateTaskRequestDto,
} from './dto';
import { DivisionEntity } from '../tag/tag-division.entity';

export enum TemplateType {
  NEWBIE = 'newbie',
  TUTOR = 'tutor',
}

export class TemplateContent {
  exams: TemplateExamRequestDto[];
  tasks: TemplateTaskRequestDto[];
  courses: TemplateCourseRequestDto[];
}

export function toTemplateContent(
  exams: TemplateExamRequestDto[],
  tasks: TemplateTaskRequestDto[],
  courses: TemplateCourseRequestDto[],
): TemplateContent {
  return { exams, tasks, courses };
}

export function TrainingToTemplateContent(
  training: TrainingDto,
): TemplateContent {
  if (training == null) return { exams: [], tasks: [], courses: [] };
  return toTemplateContent(
    training.exams
      ? training.exams.map((exam) => ({
          id: exam.id,
          tags: exam.tags,
          day: exam.day,
        }))
      : null,
    training.tasks
      ? training.tasks.map((task) => ({
          id: task.id,
          tags: task.tags,
          day: task.day,
        }))
      : null,
    training.courses
      ? training.courses.map((course) => ({
          id: course.id,
          tags: course.tags,
          day: course.day,
          isOptional: course.isOptional,
        }))
      : null,
  );
}

/**
 * `TemplateEntity`: 数据库 template 表中的实体
 */
@Entity('template')
export class TemplateEntity {
  @ManyToOne(() => DivisionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'divisionId' })
  division: DivisionEntity;

  @PrimaryColumn()
  divisionId: number;

  @PrimaryColumn({ type: 'enum', enum: TemplateType })
  type: TemplateType;

  /**
   * 培训模板
   */
  @Column({ type: 'json' })
  content: TemplateContent;
}
