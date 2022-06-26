import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamEntity, ExamProblem, toExamContent } from './exam.entity';
import { In, Repository } from 'typeorm';
import {
  CreateExamRequestDto,
  ExamAnswersRequestDto,
  ExamAnswersResponseDto,
  ExamDto,
  ExamProblemType,
  ExamForTraineeDto,
  ProblemRequestDto,
  UpdateExamRequestDto,
  TraineeGetExamResponseDto,
  TraineeGetExamError,
  TraineeSubmitExamResponseDto,
  TraineeSubmitExamError,
} from './dto';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { TrainingDto, TrainingExamDto, WildcardType } from '../common/dto';
import {
  TemplateExamRequestDto,
  TemplateExamResponseDto,
} from '../template/dto';

/**
 * compare two **unique** arrays
 * @param a
 * @param b
 */
function compareAnswers<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x) => b.includes(x));
}

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(ExamEntity)
    private readonly examRepository: Repository<ExamEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async findById(id: number, loadOwner = false): Promise<ExamEntity> {
    const query = this.examRepository.createQueryBuilder('exam');
    if (loadOwner) query.leftJoinAndSelect('exam.owner', 'owner');
    query.where('exam.id = :examId', { examId: id });
    return await query.getOne();
  }

  async toDto(
    exam: ExamEntity,
    currentUser: UserEntity,
    customTags?: string[],
  ): Promise<ExamDto> {
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      tags: customTags != null ? customTags : exam.tags,
      problems: exam.content.problems.map((problem) => ({
        title: problem.title,
        type: problem.type,
        options: problem.options,
        answers: problem.answers,
        reason: problem.reason,
      })),
      isUsed: exam.isUsed,
      ownerProfile: exam.ownerId
        ? exam.owner
          ? await this.userService.filterProfile(exam.owner, currentUser)
          : await this.userService.getProfileById(exam.ownerId, currentUser)
        : null,
    };
  }

  private static toDtoForTrainee(
    exam: ExamEntity,
    trainingExam: TrainingExamDto,
  ): ExamForTraineeDto {
    return {
      title: exam.title,
      description: exam.description,
      tags: trainingExam.tags || exam.tags,
      problems: exam.content.problems.map((problem) => ({
        title: problem.title,
        type: problem.type,
        options: problem.options,
      })),
      day: trainingExam.day,
      finished: trainingExam.finished,
    };
  }

  static validateRequestProblems(problems: ProblemRequestDto[]): boolean {
    return problems.every((problem) => {
      if (problem.answers.some((answer) => problem.options[answer] == null))
        return false;
      if (problem.type === ExamProblemType.SINGLE_CHOICE)
        return problem.answers.length === 1;
      if (problem.type === ExamProblemType.MULTIPLE_CHOICE)
        return problem.answers.length > 0;
      return false;
    });
  }

  static validateSubmitAnswers(
    problems: ExamProblem[],
    answers: ExamAnswersRequestDto[],
  ): boolean {
    if (answers.length !== problems.length) return false;
    return problems.every((problem, index) => {
      if (
        problem.type === ExamProblemType.SINGLE_CHOICE &&
        answers[index].answers.length > 1
      )
        return false;
      return answers[index].answers.every(
        (answer) => !!problem.options[answer],
      );
    });
  }

  async update(
    exam: ExamEntity,
    body: UpdateExamRequestDto,
  ): Promise<ExamEntity> {
    exam.title = body.title;
    exam.description = body.description;
    exam.tags = body.tags;
    exam.content = toExamContent(body.problems);
    return await this.examRepository.save(exam);
  }

  async create(
    body: CreateExamRequestDto,
    owner: UserEntity,
  ): Promise<ExamEntity> {
    return await this.examRepository.save({
      title: body.title,
      description: body.description,
      tags: body.tags,
      content: toExamContent(body.problems),
      owner,
    });
  }

  async delete(exam: ExamEntity): Promise<void> {
    await this.examRepository.remove(exam);
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
  ): Promise<[list: ExamEntity[], count: number]> {
    const query = this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.owner', 'owner')
      .skip(skip)
      .take(take);
    if (search) {
      if (search.wildcard === WildcardType.NONE)
        query.andWhere('exam.title = :keyword', { keyword: search.keyword });
      else {
        let keyword = search.keyword;
        if (search.wildcard === WildcardType.BOTH) keyword = `%${keyword}%`;
        else if (search.wildcard === WildcardType.BEGIN)
          keyword = `%${keyword}`;
        else if (search.wildcard === WildcardType.END) keyword = `${keyword}%`;
        query.andWhere('exam.title LIKE :keyword', { keyword });
      }
    }
    if (ownerId != null) query.andWhere('exam.ownerId = :ownerId', { ownerId });
    if (tag != null) query.andWhere(`JSON_CONTAINS(exam.tags, '"${tag}"')`);

    return await query.getManyAndCount();
  }

  static judge(
    exam: ExamEntity,
    answers: ExamAnswersRequestDto[],
  ): [results: ExamAnswersResponseDto[], correctCount: number] {
    let correctCount = 0;
    const results = exam.content.problems.map((problem, index) => {
      const isCorrect = compareAnswers(problem.answers, answers[index].answers);
      if (isCorrect) correctCount++;
      return {
        answers: problem.answers,
        reason: problem.reason,
        isCorrect,
      };
    });
    return [results, correctCount];
  }

  async checkExistenceByIds(ids: number[]): Promise<boolean> {
    return (await this.examRepository.count({ id: In(ids) })) === ids.length;
  }

  async toTemplateExamResponseDto(
    exams: TemplateExamRequestDto[],
  ): Promise<TemplateExamResponseDto[]> {
    const list = await this.examRepository.findByIds(
      exams.map((exam) => exam.id),
    );
    return list.map((exam, index) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      tags: exams[index].tags,
      day: exams[index].day,
    }));
  }

  async getFromTraining(
    training: TrainingDto,
    examId: number,
  ): Promise<TraineeGetExamResponseDto> {
    const exams = training.exams;
    if (examId < 0 || examId >= exams.length)
      return { error: TraineeGetExamError.NO_SUCH_EXAM };
    const exam = await this.findById(exams[examId].id);
    if (!exam) return { error: TraineeGetExamError.NO_SUCH_EXAM };

    return { exam: ExamService.toDtoForTrainee(exam, exams[examId]) };
  }

  async submitToTraining(
    training: TrainingDto,
    examId: number,
    answers: ExamAnswersRequestDto[],
    onSuccess?: (score: number) => Promise<any>,
  ): Promise<TraineeSubmitExamResponseDto> {
    const exams = training.exams;
    if (examId < 0 || examId >= exams.length)
      return { error: TraineeSubmitExamError.NO_SUCH_EXAM };
    const exam = await this.findById(exams[examId].id);
    if (!exam) return { error: TraineeSubmitExamError.NO_SUCH_EXAM };

    if (answers.length !== exam.content.problems.length)
      return { error: TraineeSubmitExamError.INVALID_ANSWER_COUNT };
    if (!ExamService.validateSubmitAnswers(exam.content.problems, answers))
      return { error: TraineeSubmitExamError.INVALID_ANSWER };

    const [results, correctCount] = ExamService.judge(exam, answers);
    const score =
      exam.content.problems.length > 0
        ? (100 * correctCount) / exam.content.problems.length
        : 1;
    const passed = score >= 60;

    if (passed && onSuccess != null) await onSuccess(score);

    return { results, passed };
  }

  async markAsUsed(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const res = await this.examRepository.update(
      { id: In(ids) },
      { isUsed: true },
    );
    if (res.affected !== ids.length)
      Logger.error(
        `Only Mark ${res.affected} of ${ids.length} as used.`,
        'ExamService',
      );
    return;
  }
}
