import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContentEntity } from '../common/types';
import { UserEntity } from '../user/user.entity';
import { ExamProblemType, ProblemRequestDto } from './dto';

export class ExamProblem {
  title: string;
  type: ExamProblemType;
  options: string[];
  answers: number[];
  reason: string;
}

function parseType(type: string): ExamProblemType {
  switch (type.toUpperCase()) {
    case ExamProblemType.SINGLE_CHOICE:
    case 'SINGLE':
    case '单选':
      return ExamProblemType.SINGLE_CHOICE;
    case ExamProblemType.MULTIPLE_CHOICE:
    case 'MULTIPLE':
    case '多选':
      return ExamProblemType.MULTIPLE_CHOICE;
    default:
      return null;
  }
}

function parseAnswer(str: string): number {
  if (str.length === 1 && str.charCodeAt(0) >= 65 && str.charCodeAt(0) <= 90)
    return str.charCodeAt(0) - 65;
  return parseInt(str, 10);
}

function parseAnswers(answers: string): number[] {
  if (!answers) return [];
  answers = answers.toUpperCase();
  const result: number[] = [];
  if (answers.includes(',')) {
    // comma separated
    answers.split(',').forEach((answer) => {
      const value = parseAnswer(answer);
      if (value != null) result.push(value);
    });
  } else if (answers.charCodeAt(0) >= 65 && answers.charCodeAt(0) <= 90) {
    // continuous char
    for (let i = 0; i < answers.length; i++) {
      const value = parseAnswer(answers[i]);
      if (value != null) result.push(value);
    }
  } else {
    // single answer (number)
    const value = parseAnswer(answers);
    if (value != null) result.push(value);
  }
  return result;
}

export function parseProblem(row: any[]): ExamProblem {
  if (row?.length <= 5) return null;
  const [title, type, answers, reason, ...options] = row;
  return {
    title,
    type: parseType(type),
    options,
    answers: parseAnswers(answers),
    reason,
  };
}

/**
 * 考试内容
 */
export class ExamContent {
  problems: ExamProblem[];
}

export function toExamContent(problems: ProblemRequestDto[]): ExamContent {
  return { problems };
}

/**
 * `ExamEntity`: 数据库 `exam` 表中的实体
 */
@Entity('exam')
export class ExamEntity extends ContentEntity {
  /**
   * 是否已被使用
   *
   * 被使用后不能删除
   */
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'json' })
  tags: string[];

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner?: UserEntity;

  @Column({ type: 'int', nullable: true })
  @Index()
  ownerId?: number;

  /**
   * 考试内容
   */
  @Column({ type: 'json' })
  content: ExamContent;
}
