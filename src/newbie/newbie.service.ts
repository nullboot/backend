import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NewbieEntity } from './newbie.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  GetNewbieDataShowResponseDto,
  NewbieProfileDto,
  UpdateNewbieTemplateRequestDto,
} from './dto';
import { TutorEntity } from '../tutor/tutor.entity';
import { TutorService } from '../tutor/tutor.service';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TimeRange } from '../common/types';
import {
  FilterByCity,
  FilterByDivision,
  SearchInRealname,
} from '../common/user.filter';
import { TemplateService } from '../template/template.service';
import {
  TemplateEntity,
  TemplateType,
  toTemplateContent,
  TrainingToTemplateContent,
} from '../template/template.entity';
import { CourseService } from '../course/course.service';
import { NewbieCommentService } from './newbie-comment.service';
import { NewbieCommentType } from './newbie-comment.entity';
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  startOfSecond,
  subMonths,
} from 'date-fns';
import { TrainingDto, TrainingExamDto, WildcardType } from '../common/dto';
import { hasRole, Role } from '../common/role';
import { PermissionService } from '../permission/permission.service';

@Injectable()
export class NewbieService {
  constructor(
    @InjectRepository(NewbieEntity)
    private readonly newbieRepository: Repository<NewbieEntity>,
    @Inject(forwardRef(() => TutorService))
    private readonly tutorService: TutorService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => TemplateService))
    private readonly templateService: TemplateService,
    @Inject(forwardRef(() => CourseService))
    private readonly courseService: CourseService,
    @Inject(forwardRef(() => NewbieCommentService))
    private readonly commentService: NewbieCommentService,
    @Inject(forwardRef(() => PermissionService))
    private readonly permissionService: PermissionService,
  ) {}

  private async _findByUserId(
    userId: number,
    loadUser = false,
    loadTraining = true,
  ): Promise<NewbieEntity> {
    const query = this.newbieRepository.createQueryBuilder('newbie');
    if (loadUser) query.leftJoinAndSelect('newbie.user', 'user');
    if (loadTraining) query.addSelect('newbie.training');
    query.andWhere('newbie.userId = :userId', { userId });
    return await query.getOne();
  }

  async findByUserId(
    userId: number,
    loadUser = true,
    loadTraining = true,
  ): Promise<NewbieEntity> {
    const newbie = await this._findByUserId(userId, loadUser, loadTraining);
    return newbie?.isExist ? newbie : null;
  }

  async ensureByUserId(
    userId: number,
    isExist: boolean,
  ): Promise<NewbieEntity> {
    let newbie = await this._findByUserId(userId);
    if (newbie) {
      if (newbie.isExist !== isExist) {
        newbie.isExist = isExist;
        newbie = await this.newbieRepository.save(newbie);
      }
    } else if (isExist) {
      newbie = await this.newbieRepository.save({ userId });
    }
    return newbie;
  }

  async hasPermission(
    user: UserEntity,
    newbie: NewbieEntity,
  ): Promise<boolean> {
    if (user.id === newbie.userId) return true;
    if (hasRole(user, Role.TUTOR) && newbie.tutorId === user.id) return true;
    return await this.hasPrivilege(user, newbie);
  }

  async hasPrivilege(
    user: UserEntity,
    newbie: NewbieEntity,
    role?: Role,
  ): Promise<boolean> {
    if (user.isRoot || user.id === newbie.userId) return true;
    if (newbie.user === null)
      newbie = await this.findByUserId(newbie.userId, true);
    return await this.permissionService.hasPermission(
      user,
      role ? role : undefined,
      newbie.user.divisionId,
    );
  }

  async filterProfile(
    newbie: NewbieEntity,
    currentUser: UserEntity,
    loadTutor = true,
  ): Promise<NewbieProfileDto> {
    return {
      userId: newbie.userId,
      tutorProfile:
        loadTutor && newbie.tutorId
          ? newbie.tutor
            ? await this.tutorService.filterProfile(newbie.tutor, currentUser)
            : await this.tutorService.getProfileByUserId(
                newbie.tutorId,
                currentUser,
              )
          : null,
      graduationTime: newbie.graduationTime,
      assignedTime: newbie.assignedTime,
      isAssigned: newbie.isAssigned,
      isGraduate: newbie.isGraduate,
      onBoarding: newbie.onBoarding,
      examAverageScore: newbie.examAverageScore,
      userProfile: newbie.user
        ? await this.userService.filterProfile(newbie.user, currentUser)
        : await this.userService.getProfileById(newbie.userId, currentUser),
    };
  }

  async getList(
    skip: number,
    take: number,
    {
      cityId,
      divisionIds,
      searchRealname,
      tutorId,
      isAssigned,
      isGraduate,
      noTutor,
      pendingFirst,
    }: {
      cityId?: number;
      divisionIds?: number[];
      searchRealname?: {
        keyword: string;
        wildcard?: WildcardType;
      };
      tutorId?: number;
      isAssigned?: boolean;
      isGraduate?: boolean;
      noTutor?: boolean;
      pendingFirst?: boolean;
    } = {},
  ): Promise<[list: NewbieEntity[], count: number]> {
    const query = this.newbieRepository
      .createQueryBuilder('newbie')
      .leftJoinAndSelect('newbie.user', 'user')
      .skip(skip || 0)
      .take(take)
      .where('newbie.isExist = true');

    if (cityId != null) FilterByCity(query, cityId);
    if (divisionIds != null) FilterByDivision(query, divisionIds);
    if (searchRealname)
      SearchInRealname(query, searchRealname.keyword, searchRealname.wildcard);

    if (tutorId != null)
      query.andWhere('newbie.tutorId = :tutorId', { tutorId });

    if (isAssigned != null)
      query.andWhere('newbie.isAssigned = :isAssigned', { isAssigned });

    if (isGraduate != null)
      query.andWhere('newbie.isGraduate = :isGraduate', { isGraduate });

    if (noTutor) query.andWhere('newbie.tutorId IS NULL');

    // null first
    if (pendingFirst) query.orderBy('newbie.tutorId', 'ASC');

    return await query.getManyAndCount();
  }

  async getDataShow({
    divisionIds,
    timeRange,
  }: {
    divisionIds?: number[];
    timeRange?: TimeRange;
  } = {}): Promise<GetNewbieDataShowResponseDto> {
    function PrefixQuery(
      newbieRepo: Repository<NewbieEntity>,
      divisionIds?: number[],
    ): SelectQueryBuilder<NewbieEntity> {
      const query = newbieRepo
        .createQueryBuilder('newbie')
        .leftJoinAndSelect('newbie.user', 'user')
        .where('newbie.isExist = true');
      if (divisionIds) FilterByDivision(query, divisionIds);
      return query;
    }

    function PrefixQueryAtMonth({
      newbieRepo,
      divisionIds,
      date,
    }: {
      newbieRepo: Repository<NewbieEntity>;
      divisionIds?: number[];
      date: Date;
    }): SelectQueryBuilder<NewbieEntity> {
      const query = PrefixQuery(newbieRepo, divisionIds);
      query.andWhere('user.registerTime >= :startTime', {
        startTime: startOfMonth(date),
      });
      query.andWhere('user.registerTime <= :endTime', {
        endTime: endOfMonth(date),
      });
      return query;
    }

    const dataShow = new GetNewbieDataShowResponseDto();
    dataShow.basis.push({ name: '部门新人总数', data: [] }); // basis[0]
    dataShow.basis.push({ name: '参与培训人数', data: [] }); // basis[1]
    dataShow.basis.push({ name: '已毕业人数', data: [] }); // basis[2]
    dataShow.training.push({ name: '新入职人数', data: [] }); // training[0]
    dataShow.training.push({ name: '参与培训人数', data: [] }); // training[1]
    dataShow.training.push({ name: '参与培训比例', data: [] }); // training[2]
    dataShow.graduate.push({ name: '新毕业人数', data: [] }); //graduate[0]
    dataShow.graduate.push({ name: '入职新人毕业比例', data: [] }); //graduate[1]

    // training, graduate[1], basis[0]

    let total: number;
    {
      const query = PrefixQuery(this.newbieRepository, divisionIds);
      query.andWhere('user.registerTime <= :startTime', {
        startTime: endOfMonth(subMonths(timeRange.startTime, 1)),
      });
      total = await query.getCount();
    }
    for (
      let date = startOfMonth(timeRange.startTime);
      date <= endOfMonth(timeRange.endTime);
      date = startOfMonth(addMonths(date, 1))
    ) {
      let query = PrefixQueryAtMonth({
        newbieRepo: this.newbieRepository,
        divisionIds,
        date,
      });
      const count = await query.getCount();
      dataShow.training[0].data.push(count);
      total += count;
      dataShow.basis[0].data.push(total);
      query.andWhere('newbie.isGraduate = true');
      dataShow.graduate[1].data.push(
        count > 0 ? (100 * (await query.getCount())) / count : 0,
      );
      query = PrefixQueryAtMonth({
        newbieRepo: this.newbieRepository,
        divisionIds,
        date,
      });
      query.andWhere('newbie.isAssigned = true');
      const count2 = await query.getCount();
      dataShow.training[1].data.push(count2);
      dataShow.training[2].data.push(count > 0 ? (100 * count2) / count : 0);
    }

    // graduate[0], basis[2]
    {
      const query = PrefixQuery(this.newbieRepository, divisionIds);
      query
        .andWhere('newbie.isGraduate = true')
        .andWhere('newbie.graduationTime <= :startTime', {
          startTime: endOfMonth(subMonths(timeRange.startTime, 1)),
        });
      total = await query.getCount();
    }
    for (
      let d = startOfMonth(timeRange.startTime);
      d <= endOfMonth(timeRange.endTime);
      d = startOfMonth(addMonths(d, 1))
    ) {
      const query = PrefixQuery(this.newbieRepository, divisionIds);
      query.andWhere('newbie.isGraduate = true');
      query.andWhere('newbie.graduationTime >= :startTime', {
        startTime: startOfMonth(d),
      });
      query.andWhere('newbie.graduationTime <= :endTime', {
        endTime: endOfMonth(d),
      });
      const count = await query.getCount();
      dataShow.graduate[0].data.push(count);
      total += count;
      dataShow.basis[2].data.push(total);
    }

    // basis[1]
    {
      const query = PrefixQuery(this.newbieRepository, divisionIds);
      query
        .andWhere('newbie.isAssigned = true')
        .andWhere('newbie.assignedTime <= :startTime', {
          startTime: endOfMonth(subMonths(timeRange.startTime, 1)),
        });
      total = await query.getCount();
    }
    for (
      let d = startOfMonth(timeRange.startTime);
      d <= endOfMonth(timeRange.endTime);
      d = startOfMonth(addMonths(d, 1))
    ) {
      const query = PrefixQuery(this.newbieRepository, divisionIds);
      query.andWhere('newbie.isAssigned = true');
      query.andWhere('newbie.assignedTime >= :startTime', {
        startTime: startOfMonth(d),
      });
      query.andWhere('newbie.assignedTime <= :endTime', {
        endTime: endOfMonth(d),
      });
      const count = await query.getCount();
      dataShow.training[1].data.push(count);
      total += count;
      dataShow.basis[1].data.push(total);
    }

    // score
    dataShow.score.push({
      name: '部门新人平均分',
      data: await this.commentService.getAverageScore({
        beforeMonth: timeRange.endTime,
        divisionIds,
        type: NewbieCommentType.TutorToNewbie,
      }),
    });
    dataShow.score.push({
      name: '全平台新人平均分',
      data: await this.commentService.getAverageScore({
        beforeMonth: timeRange.endTime,
        type: NewbieCommentType.TutorToNewbie,
      }),
    });
    return dataShow;
  }

  async getAssignedAndAllNewbieCountByMonthAndDivision(
    d: Date,
    divisionIds: number[],
  ): Promise<[count: number, total: number]> {
    const query = this.newbieRepository
      .createQueryBuilder('newbie')
      .leftJoinAndSelect('newbie.user', 'user')
      .where('newbie.isExist = true');
    if (divisionIds) FilterByDivision(query, divisionIds);
    query.andWhere('user.registerTime <= :date', { date: endOfMonth(d) });
    const total = await query.getCount();
    query.andWhere('newbie.tutorId IS NOT NULL');
    const count = await query.getCount();
    return [count, total];
  }

  private async getTraining(newbie: NewbieEntity) {
    if (newbie.training) return newbie.training;
    const query = this.newbieRepository
      .createQueryBuilder('newbie')
      .addSelect('newbie.training')
      .where('newbie.userId = :userId', { userId: newbie.userId });
    const { training } = await query.getOne();
    return training;
  }

  private async assignTrainingAndSave(
    newbie: NewbieEntity,
    training: TrainingDto,
  ) {
    newbie.training = training;
    return await this.checkGraduation(newbie);
  }

  /**
   * 给新人分配导师
   * @param newbie 新人实体
   * @param tutor 导师实体
   */
  async assignTutor(
    newbie: NewbieEntity,
    tutor: TutorEntity,
  ): Promise<NewbieEntity> {
    // following two lines CANNOT swap order
    await this.tutorService.updateNewbieCount(tutor, 1);
    if (newbie.tutorId != null)
      await this.tutorService.updateNewbieCountByUserId(newbie.tutorId, -1);
    newbie.tutorId = tutor.userId;
    const newbieUser =
      newbie.user || (await this.userService.findById(newbie.userId));
    const template = await this.templateService.findByTypeAndId(
      TemplateType.NEWBIE,
      newbieUser.divisionId,
    );
    return await this.assignTrainingAndSave(
      newbie,
      await this.templateService.toTraining(template?.content),
    );
  }

  private async graduationPipe(newbie: NewbieEntity): Promise<NewbieEntity> {
    if (newbie.isGraduate) return newbie;
    const training = await this.getTraining(newbie);
    if (!training) return newbie;

    // finish all exams
    if (training.exams.some((e) => !e.finished)) return newbie;

    // finish all tasks
    if (training.tasks.some((t) => !t.finished)) return newbie;

    // finish all courses
    if (training.courses.some((c) => !c.isOptional && !c.finished))
      return newbie;

    // finish comment to tutor
    const comment = await this.commentService.findOneByNewbieId(
      newbie.userId,
      NewbieCommentType.NewbieToTutor,
    );
    if (!comment) return newbie;

    newbie.isGraduate = true;
    newbie.graduationTime = startOfSecond(new Date());
    await this.tutorService.updateAsNewbieGraduateByUserId(
      newbie.tutorId,
      comment.score,
    );
    return newbie;
  }

  async finishExam(newbie: NewbieEntity, examId: number, score: number) {
    function calculateExamAverageScore(exams: TrainingExamDto[]): number {
      let tot = 0;
      for (let i = 0; i < exams.length; i++) tot += exams[i].score;
      return exams.length > 0 ? tot / exams.length : 0;
    }

    const training = await this.getTraining(newbie);
    training.exams[examId].finished = true;
    training.exams[examId].score = score;
    newbie.examAverageScore = calculateExamAverageScore(training.exams);
    return await this.assignTrainingAndSave(newbie, training);
  }

  async finishTask(newbie: NewbieEntity, taskId: number) {
    const training = await this.getTraining(newbie);
    training.tasks[taskId].finished = true;
    return await this.assignTrainingAndSave(newbie, training);
  }

  async finishCourseSection(
    newbie: NewbieEntity,
    courseId: number,
    sectionId: number,
  ) {
    const training = await this.getTraining(newbie);
    training.courses[courseId].sections[sectionId].finished = true;
    training.courses[courseId].finished = training.courses[
      courseId
    ].sections.every((s) => s.finished);
    return await this.assignTrainingAndSave(newbie, training);
  }

  async getProfileByUserId(
    userId: number,
    currentUser: UserEntity,
  ): Promise<NewbieProfileDto> {
    if (userId == null) return null;
    const newbie = await this.findByUserId(userId, true);
    if (!newbie) return null;
    return await this.filterProfile(newbie, currentUser);
  }

  async updateTemplate(
    newbie: NewbieEntity,
    body: UpdateNewbieTemplateRequestDto,
  ): Promise<NewbieEntity> {
    newbie.training = await this.templateService.toTraining(
      toTemplateContent(body.exams, body.tasks, body.courses),
    );
    if (body.assignToNewbie) {
      newbie.isAssigned = true;
      newbie.assignedTime = startOfSecond(new Date());
    }
    return await this.newbieRepository.save(newbie);
  }

  getTemplate(newbie: NewbieEntity): TemplateEntity {
    return {
      divisionId: newbie.user.divisionId,
      type: TemplateType.NEWBIE,
      content: TrainingToTemplateContent(newbie.training),
      division: null,
    };
  }

  async checkGraduation(newbie: NewbieEntity) {
    return await this.newbieRepository.save(await this.graduationPipe(newbie));
  }
}
