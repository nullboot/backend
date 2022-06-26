import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TutorEntity } from './tutor.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { GetTutorDataShowResponseDto, TutorProfileDto } from './dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Role } from '../common/role';
import { TimeRange } from '../common/types';
import {
  FilterByCity,
  FilterByDivision,
  SearchInRealname,
} from '../common/user.filter';
import { TemplateType } from '../template/template.entity';
import { TemplateService } from '../template/template.service';
import { CourseService } from '../course/course.service';
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  startOfSecond,
  subMonths,
} from 'date-fns';
import { NewbieService } from '../newbie/newbie.service';
import { TrainingDto, WildcardType } from '../common/dto';
import { PermissionService } from '../permission/permission.service';

@Injectable()
export class TutorService {
  constructor(
    @InjectRepository(TutorEntity)
    private readonly tutorRepository: Repository<TutorEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => TemplateService))
    private readonly templateService: TemplateService,
    @Inject(forwardRef(() => CourseService))
    private readonly courseService: CourseService,
    @Inject(forwardRef(() => NewbieService))
    private readonly newbieService: NewbieService,
    @Inject(forwardRef(() => PermissionService))
    private readonly permissionService: PermissionService,
  ) {}

  private async _findByUserId(
    userId: number,
    loadUser = false,
    loadTraining = true,
  ): Promise<TutorEntity> {
    const query = this.tutorRepository.createQueryBuilder('tutor');
    if (loadUser) query.leftJoinAndSelect('tutor.user', 'user');
    if (loadTraining) query.addSelect('tutor.training');
    query.where('tutor.userId = :userId', { userId });
    return await query.getOne();
  }

  async findByUserId(
    userId: number,
    loadUser = true,
    loadTraining = true,
  ): Promise<TutorEntity> {
    const tutor = await this._findByUserId(userId, loadUser, loadTraining);
    return tutor?.isExist ? tutor : null;
  }

  async ensureByUserId(userId: number, isExist: boolean): Promise<TutorEntity> {
    let tutor = await this._findByUserId(userId);
    if (tutor) {
      if (tutor.isExist !== isExist) {
        tutor.isExist = isExist;
        tutor = await this.tutorRepository.save(tutor);
      }
    } else if (isExist) {
      tutor = await this.tutorRepository.save({ userId });
    }
    return tutor;
  }

  async hasPermission(
    user: UserEntity,
    tutor: TutorEntity,
    role?: Role,
  ): Promise<boolean> {
    if (user.id === tutor.userId) return true;
    return await this.hasPrivilege(user, tutor, role);
  }

  async hasPrivilege(
    user: UserEntity,
    tutor: TutorEntity,
    role?: Role,
  ): Promise<boolean> {
    if (user.isRoot) return true;
    if (tutor.user === null)
      tutor = await this.findByUserId(tutor.userId, true);
    return await this.permissionService.hasPermission(
      user,
      role ? role : undefined,
      tutor.user.divisionId,
    );
  }

  async filterProfile(
    tutor: TutorEntity,
    currentUser: UserEntity,
  ): Promise<TutorProfileDto> {
    return {
      userId: tutor.userId,
      nominateTime: tutor.nominateTime,
      approvedTime: tutor.approvedTime,
      graduateNewbieCount: tutor.graduateNewbieCount,
      graduationTime: tutor.graduationTime,
      isApproved: tutor.isApproved,
      isGraduate: tutor.isGraduate,
      totalNewbieCount: tutor.totalNewbieCount,
      totalScore: tutor.totalScore,
      averageScore: tutor.averageScore,
      userProfile: tutor.user
        ? await this.userService.filterProfile(tutor.user, currentUser)
        : await this.userService.getProfileById(tutor.userId, currentUser),
    };
  }

  async getList(
    skip: number,
    take: number,
    {
      cityId,
      divisionIds,
      searchRealname,
      isApproved,
      isGraduate,
      pendingFirst,
    }: {
      cityId?: number;
      divisionIds?: number[];
      searchRealname?: {
        keyword: string;
        wildcard?: WildcardType;
      };
      isApproved?: boolean;
      isGraduate?: boolean;
      pendingFirst?: boolean;
    } = {},
  ): Promise<[list: TutorEntity[], count: number]> {
    const query = this.tutorRepository
      .createQueryBuilder('tutor')
      .leftJoinAndSelect('tutor.user', 'user')
      .skip(skip || 0)
      .take(take)
      .where('tutor.isExist = true');

    if (cityId != null) FilterByCity(query, cityId);
    if (divisionIds != null) FilterByDivision(query, divisionIds);
    if (searchRealname)
      SearchInRealname(query, searchRealname.keyword, searchRealname.wildcard);

    if (isApproved !== undefined) {
      if (isApproved === null) query.andWhere('tutor.isApproved IS NULL');
      else query.andWhere('tutor.isApproved = :isApproved', { isApproved });
    }

    if (isGraduate != null)
      query.andWhere('tutor.isGraduate = :isGraduate', { isGraduate });

    if (pendingFirst) query.orderBy('tutor.isApproved', 'ASC');

    return await query.getManyAndCount();
  }

  async getDataShow({
    divisionIds,
    timeRange,
  }: {
    divisionIds?: number[];
    timeRange?: TimeRange;
  } = {}): Promise<GetTutorDataShowResponseDto> {
    function PrefixQuery(
      tutorRepo: Repository<TutorEntity>,
      divisionIds?: number[],
    ): SelectQueryBuilder<TutorEntity> {
      const query = tutorRepo
        .createQueryBuilder('tutor')
        .leftJoinAndSelect('tutor.user', 'user')
        .where('tutor.isExist = true');
      if (divisionIds) FilterByDivision(query, divisionIds);
      return query;
    }

    const dataShow = new GetTutorDataShowResponseDto();
    dataShow.basis.push({ name: '部门导师总数', data: [] }); // basis[0], isAssigned = true
    dataShow.basis.push({ name: '审核通过导师总数', data: [] }); // basis[1], isApproved = true
    dataShow.basis.push({ name: '正式上岗导师总数', data: [] }); // basis[2], isGraduate = true
    dataShow.approval.push({ name: '新增导师人数', data: [] }); // approval[0], isAssigned = true
    dataShow.approval.push({ name: '正式上岗导师数', data: [] }); // approval[1], isGraduate = true
    dataShow.approval.push({ name: '正式上岗导师比例', data: [] }); // approval[2]
    dataShow.assignment.push({ name: '已分配新人数', data: [] }); // assignment[0]
    dataShow.assignment.push({ name: '未分配新人数', data: [] }); // assignment[1]
    dataShow.assignment.push({ name: '导师分配率', data: [] }); // assignment[2]

    let total: number;
    //approval, basis[0]
    {
      const query = PrefixQuery(this.tutorRepository, divisionIds);
      query.andWhere('tutor.nominateTime <= :startTime', {
        startTime: endOfMonth(subMonths(timeRange.startTime, 1)),
      });
      total = await query.getCount();
    }
    for (
      let d = startOfMonth(timeRange.startTime);
      d <= endOfMonth(timeRange.endTime);
      d = startOfMonth(addMonths(d, 1))
    ) {
      const query = PrefixQuery(this.tutorRepository, divisionIds);
      query
        .andWhere('tutor.nominateTime >= :startTime', {
          startTime: startOfMonth(d),
        })
        .andWhere('tutor.nominateTime <= :endTime', {
          endTime: endOfMonth(d),
        });
      const count = await query.getCount();
      dataShow.approval[0].data.push(count);
      total += count;
      dataShow.basis[0].data.push(total);
      query.andWhere('tutor.isGraduate = true');
      const count2 = await query.getCount();
      dataShow.approval[1].data.push(count2);
      dataShow.approval[2].data.push(count2 > 0 ? (100 * count) / count2 : 0);
    }

    // basis[1]
    for (
      let d = startOfMonth(timeRange.startTime);
      d <= endOfMonth(timeRange.endTime);
      d = startOfMonth(addMonths(d, 1))
    ) {
      const query = PrefixQuery(this.tutorRepository, divisionIds);
      query
        .andWhere('tutor.isApproved = true')
        .andWhere('tutor.approvedTime <= :endTime', {
          endTime: endOfMonth(d),
        });
      dataShow.basis[1].data.push(await query.getCount());
    }

    // basis[2]
    for (
      let d = startOfMonth(timeRange.startTime);
      d <= endOfMonth(timeRange.endTime);
      d = startOfMonth(addMonths(d, 1))
    ) {
      const query = PrefixQuery(this.tutorRepository, divisionIds);
      query
        .andWhere('tutor.isGraduate = true')
        .andWhere('tutor.graduationTime <= :endTime', {
          endTime: endOfMonth(d),
        });
      dataShow.basis[2].data.push(await query.getCount());
    }

    // assignment
    for (
      let d = startOfMonth(timeRange.startTime);
      d <= endOfMonth(timeRange.endTime);
      d = startOfMonth(addMonths(d, 1))
    ) {
      const [count, total] =
        await this.newbieService.getAssignedAndAllNewbieCountByMonthAndDivision(
          d,
          divisionIds,
        );
      dataShow.assignment[0].data.push(count);
      dataShow.assignment[1].data.push(total - count);
      dataShow.assignment[2].data.push(total > 0 ? (100 * count) / total : 0);
    }

    //score[0]
    {
      const query = PrefixQuery(this.tutorRepository, divisionIds);
      const { avg } = await query
        .andWhere('tutor.graduateNewbieCount > 0')
        .addSelect('AVG(tutor.averageScore)', 'avg')
        .getRawOne();
      dataShow.score.push({ name: '部门导师平均分', data: Number(avg || 0) });
    }
    //score[1]
    {
      const query = PrefixQuery(this.tutorRepository);
      const { avg: avg } = await query
        .andWhere('tutor.graduateNewbieCount > 0')
        .addSelect('AVG(tutor.averageScore)', 'avg')
        .getRawOne();
      dataShow.score.push({ name: '全平台导师平均分', data: Number(avg || 0) });
    }
    return dataShow;
  }

  async getProfileByUserId(
    userId: number,
    currentUser: UserEntity,
  ): Promise<TutorProfileDto> {
    if (userId == null) return null;
    const tutor = await this.findByUserId(userId, true);
    if (!tutor) return null;
    return await this.filterProfile(tutor, currentUser);
  }

  async updateNewbieCount(tutor: TutorEntity, delta: number) {
    tutor.totalNewbieCount += delta;
    await this.tutorRepository.save(tutor);
  }

  async updateNewbieCountByUserId(userId: number, delta: number) {
    const tutor = await this._findByUserId(userId);
    await this.updateNewbieCount(tutor, delta);
  }

  async updateAsNewbieGraduateByUserId(userId: number, score: number) {
    const tutor = await this._findByUserId(userId);
    tutor.graduateNewbieCount++;
    tutor.totalScore += score;
    tutor.averageScore = tutor.totalScore / tutor.graduateNewbieCount;
    await this.tutorRepository.save(tutor);
  }

  async nominate(user: UserEntity) {
    await this.userService.updateRoles(user, [Role.TUTOR, ...user.roles]);
    const tutor = await this.findByUserId(user.id);
    tutor.nominateTime = startOfSecond(new Date());
    await this.tutorRepository.save(tutor);
  }

  async approve(tutor: TutorEntity, approve: boolean): Promise<TutorEntity> {
    tutor.isApproved = approve;
    if (approve) {
      tutor.approvedTime = startOfSecond(new Date());
      const tutorUser =
        tutor.user || (await this.userService.findById(tutor.userId));
      const template = await this.templateService.findByTypeAndId(
        TemplateType.TUTOR,
        tutorUser.divisionId,
      );
      tutor.training = await this.templateService.toTraining(template?.content);
    }
    return await this.checkGraduation(tutor);
  }

  private async getTraining(tutor: TutorEntity) {
    if (tutor.training) return tutor.training;
    const query = this.tutorRepository
      .createQueryBuilder('tutor')
      .addSelect('tutor.training')
      .where('tutor.userId = :userId', { userId: tutor.userId });
    const { training } = await query.getOne();
    return training;
  }

  private async assignTrainingAndSave(
    tutor: TutorEntity,
    training: TrainingDto,
  ) {
    tutor.training = training;
    return await this.checkGraduation(tutor);
  }

  private async graduationPipe(tutor: TutorEntity): Promise<TutorEntity> {
    if (tutor.isGraduate || !tutor.isApproved) return tutor;
    const training = await this.getTraining(tutor);
    if (!training) return tutor;

    // finish all exams
    if (training.exams.some((e) => !e.finished)) return tutor;

    // finish all tasks
    if (training.tasks.some((t) => !t.finished)) return tutor;

    // finish all courses
    if (training.courses.some((c) => !c.isOptional && !c.finished))
      return tutor;

    tutor.isGraduate = true;
    tutor.graduationTime = startOfSecond(new Date());
    return tutor;
  }

  async finishExam(tutor: TutorEntity, examId: number, score: number) {
    const training = await this.getTraining(tutor);
    training.exams[examId].finished = true;
    training.exams[examId].score = score;
    return await this.assignTrainingAndSave(tutor, training);
  }

  async finishTask(tutor: TutorEntity, taskId: number) {
    const training = await this.getTraining(tutor);
    training.tasks[taskId].finished = true;
    return await this.assignTrainingAndSave(tutor, training);
  }

  async finishCourseSection(
    tutor: TutorEntity,
    courseId: number,
    sectionId: number,
  ) {
    const training = await this.getTraining(tutor);
    training.courses[courseId].sections[sectionId].finished = true;
    training.courses[courseId].finished = training.courses[
      courseId
    ].sections.every((s) => s.finished);
    return await this.assignTrainingAndSave(tutor, training);
  }

  async checkGraduation(tutor: TutorEntity): Promise<TutorEntity> {
    return await this.tutorRepository.save(await this.graduationPipe(tutor));
  }
}
