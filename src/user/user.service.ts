import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';

import {
  CreateUserRequestDto,
  UpdateUserProfileError,
  UpdateUserProfileRequestDto,
  UserProfileDto,
} from './dto';
import { Role } from '../common/role';
import { NewbieService } from '../newbie/newbie.service';
import { TutorService } from '../tutor/tutor.service';
import { CityService } from '../tag/tag-city.service';
import {
  FilterByCity,
  FilterByDivision,
  SearchInRealname,
} from '../common/user.filter';
import { DivisionService } from '../tag/tag-division.service';
import { WildcardType } from '../common/dto';

/**
 * `UserService`: 执行 user 相关的数据处理（数据库操作等）
 */
@Injectable()
export class UserService {
  /**
   * 构造函数
   * @param userRepository `UserEntity` 的存储库
   * @param newbieService
   * @param tutorService
   * @param divisionService
   * @param cityService
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => NewbieService))
    private readonly newbieService: NewbieService,
    @Inject(forwardRef(() => TutorService))
    private readonly tutorService: TutorService,
    @Inject(forwardRef(() => DivisionService))
    private readonly divisionService: DivisionService,
    @Inject(forwardRef(() => CityService))
    private readonly cityService: CityService,
  ) {}

  /**
   * 根据 `id` 查找用户
   * @param id 用户ID
   * @param loadTags
   */
  async findById(id: number, loadTags = false): Promise<UserEntity> {
    const query = this.userRepository.createQueryBuilder('user');
    if (loadTags)
      query
        .leftJoinAndSelect('user.city', 'city')
        .leftJoinAndSelect('user.division', 'division');
    query.andWhere('user.id = :userId', { userId: id });
    return await query.getOne();
  }

  /**
   * 根据 `username` 查找用户
   * @param username 用户名
   */
  async findByUsername(username: string): Promise<UserEntity> {
    return await this.userRepository.findOne({ username });
  }

  /**
   * 根据 `email` 查找用户
   * @param email E-mail
   */
  async findByEmail(email: string): Promise<UserEntity> {
    return await this.userRepository.findOne({ email });
  }

  async updateProfile(
    user: UserEntity,
    {
      username,
      email,
      publicEmail,
      realname,
      cityId,
      divisionId,
    }: UpdateUserProfileRequestDto,
  ): Promise<[UpdateUserProfileError, UserEntity]> {
    const changeUsername = username != null;
    const changeEmail = email != null;
    try {
      if (changeUsername) user.username = username;
      if (changeEmail) user.email = email;
      if (publicEmail != null) user.publicEmail = publicEmail;
      if (realname != null) user.realname = realname;
      if (cityId != null) user.cityId = cityId;
      if (divisionId != null) user.divisionId = divisionId;
      user = await this.userRepository.save(user);
    } catch (e) {
      let conflictUser = await this.findByUsername(username);
      if (changeUsername && conflictUser && conflictUser.id !== user.id)
        return [UpdateUserProfileError.DUPLICATE_USERNAME, null];

      conflictUser = await this.findByEmail(email);
      if (changeEmail && conflictUser && conflictUser.id !== user.id)
        return [UpdateUserProfileError.DUPLICATE_EMAIL, null];

      throw e;
    }

    return [null, user];
  }

  /**
   * 根据 `currentUser` 的身份生成 `user` 的 Profile（屏蔽未公开的邮箱等）
   * @param user 用户实体
   * @param currentUser 当前用户实体
   */
  async filterProfile(
    user: UserEntity,
    currentUser: UserEntity,
  ): Promise<UserProfileDto> {
    return {
      id: user.id,
      username: user.username,
      realname: user.realname,
      email:
        user.publicEmail ||
        user.id === currentUser.id ||
        currentUser.roles.includes(Role.ADMIN) ||
        currentUser.isRoot
          ? user.email
          : null,
      publicEmail: user.publicEmail,
      isRoot: user.isRoot,
      registerTime: user.registerTime,
      roles: user.roles,
      city: user.city
        ? CityService.toDto(user.city)
        : await this.cityService.getDtoById(user.cityId),
      division: user.division
        ? DivisionService.toDto(user.division)
        : await this.divisionService.getDtoById(user.divisionId),
    };
  }

  /**
   * 覆盖 `user` 的角色列表；**没有鉴权，直接覆盖**
   * @param user 用户实体
   * @param roles （新）角色列表
   */
  async updateRoles(user: UserEntity, roles: Role[]): Promise<UserEntity> {
    user.roles = roles;
    user = await this.userRepository.save(user);
    await this.ensureRoles(user);
    return user;
  }

  private async ensureRoles(user: UserEntity): Promise<void> {
    await this.newbieService.ensureByUserId(
      user.id,
      user.roles.includes(Role.NEWBIE),
    );
    await this.tutorService.ensureByUserId(
      user.id,
      user.roles.includes(Role.TUTOR),
    );
  }

  async validateUsername(username: string): Promise<boolean> {
    return (await this.userRepository.count({ username })) === 0;
  }

  async validateEmail(email: string): Promise<boolean> {
    return (await this.userRepository.count({ email })) === 0;
  }

  async create({
    username,
    realname,
    email,
    publicEmail,
    roles,
    cityId,
    divisionId,
  }: CreateUserRequestDto): Promise<UserEntity> {
    const user = await this.userRepository.save({
      username,
      realname,
      email,
      publicEmail,
      roles,
      registerTime: new Date(),
      cityId: cityId,
      divisionId: divisionId,
    });
    await this.ensureRoles(user);
    return user;
  }

  async getList(
    skip: number,
    take: number,
    {
      cityId,
      divisionIds,
      searchRealname,
      filterByRole,
    }: {
      cityId?: number;
      divisionIds?: number[];
      searchRealname?: {
        keyword: string;
        wildcard?: WildcardType;
      };
      filterByRole?: { role: Role; without?: boolean };
    } = {},
  ): Promise<[list: UserEntity[], count: number]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .skip(skip || 0)
      .take(take);

    if (cityId != null) FilterByCity(query, cityId);
    if (divisionIds != null) FilterByDivision(query, divisionIds);
    if (searchRealname)
      SearchInRealname(query, searchRealname.keyword, searchRealname.wildcard);

    if (filterByRole) {
      if (filterByRole.without)
        query.andWhere(`NOT JSON_CONTAINS(roles, '"${filterByRole.role}"')`);
      else query.andWhere(`JSON_CONTAINS(roles, '"${filterByRole.role}"')`);
    }

    return await query.getManyAndCount();
  }

  async getCountByDivisionId(divisionId: number): Promise<number> {
    return this.userRepository.count({ divisionId });
  }

  async getProfileById(id: number, currentUser: UserEntity) {
    if (id == null) return null;
    const user = await this.findById(id, true);
    if (!user) return null;
    return await this.filterProfile(user, currentUser);
  }
}
