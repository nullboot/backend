import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TutorService } from './tutor.service';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from '../user/user.entity';
import { IntParam } from '../common/validators';
import { CurrentUser } from '../common/user.decorator';
import {
  ApproveTutorError,
  ApproveTutorRequestDto,
  ApproveTutorResponseDto,
  GetAwardError,
  GetAwardResponseDto,
  GetTutorDataShowError,
  GetTutorDataShowRequestDto,
  GetTutorDataShowResponseDto,
  GetTutorProfileError,
  GetTutorProfileResponseDto,
  GetTutorsError,
  GetTutorsRequestDto,
  GetTutorsResponseDto,
  GiveAwardError,
  GiveAwardRequestDto,
  GiveAwardResponseDto,
  NominateTutorError,
  NominateTutorResponseDto,
  TutorStatus,
} from './dto';
import { hasRole, Role } from '../common/role';
import { PermissionService } from '../permission/permission.service';
import { DivisionService } from '../tag/tag-division.service';
import { CityService } from '../tag/tag-city.service';
import { UserService } from '../user/user.service';
import { differenceInMonths, endOfMonth, startOfMonth } from 'date-fns';
import { TutorAwardService } from './tutur-award.service';
import { WildcardType } from '../common/dto';

/* Progress:
 *  pending (-> rejected) -> approved (training -> graduated)
 */
function statusToIsApproved(status: TutorStatus) {
  if (status === TutorStatus.pending) return null;
  if (status === TutorStatus.rejected) return false;
  return status != null ? true : undefined;
}

function statusToIsGraduate(status: TutorStatus) {
  if (status === TutorStatus.graduated) return true;
  if (status === TutorStatus.training) return false;
  return undefined;
}

@ApiTags('ROLE::Tutor')
@ApiBearerAuth()
@Controller('tutor')
@UseGuards(AuthGuard('jwt'))
export class TutorController {
  constructor(
    private readonly tutorService: TutorService,
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
    private readonly cityService: CityService,
    private readonly divisionService: DivisionService,
    private readonly awardService: TutorAwardService,
  ) {}

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get profile of a tutor.' })
  async getTutorProfile(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
  ): Promise<GetTutorProfileResponseDto> {
    if (!currentUser) return { error: GetTutorProfileError.PERMISSION_DENIED };
    const tutor = await this.tutorService.findByUserId(id);
    if (!tutor) return { error: GetTutorProfileError.NO_SUCH_TUTOR };
    if (!(await this.tutorService.hasPermission(currentUser, tutor)))
      return { error: GetTutorProfileError.PERMISSION_DENIED };

    return {
      profile: await this.tutorService.filterProfile(tutor, currentUser),
      training: tutor.training,
    };
  }

  @ApiTags('ROLE::Hrbp')
  @Post(':id/approve')
  @ApiOperation({ summary: '[HRBP] Approve a tutor.' })
  async approveTutor(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: ApproveTutorRequestDto,
  ): Promise<ApproveTutorResponseDto> {
    if (!currentUser) return { error: ApproveTutorError.PERMISSION_DENIED };
    let tutor = await this.tutorService.findByUserId(id, true);
    if (!tutor) return { error: ApproveTutorError.NO_SUCH_TUTOR };
    if (!(await this.tutorService.hasPrivilege(currentUser, tutor, Role.HRBP)))
      return { error: ApproveTutorError.PERMISSION_DENIED };

    if (tutor.isApproved) return { error: ApproveTutorError.ALREADY_APPROVED };
    if (body.approve === false && tutor.isApproved === false)
      return { error: ApproveTutorError.ALREADY_REJECTED };

    tutor = await this.tutorService.approve(tutor, body.approve);

    return {
      profile: await this.tutorService.filterProfile(tutor, currentUser),
    };
  }

  @ApiTags('ROLE::Admin')
  @Post(':id/nominate')
  @ApiOperation({ summary: '[ADMIN] Nominate a tutor.' })
  async nominateTutor(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
  ): Promise<NominateTutorResponseDto> {
    if (!currentUser) return { error: NominateTutorError.PERMISSION_DENIED };
    const user = await this.userService.findById(id);
    if (!user) return { error: NominateTutorError.NO_SUCH_USER };
    if (
      !(await this.permissionService.hasPermission(
        currentUser,
        Role.ADMIN,
        user.divisionId,
      ))
    )
      return { error: NominateTutorError.PERMISSION_DENIED };

    if (user.roles.includes(Role.TUTOR))
      return { error: NominateTutorError.ALREADY_NOMINATED };

    await this.tutorService.nominate(user);

    return {
      profile: await this.tutorService.getProfileByUserId(user.id, currentUser),
    };
  }

  @Post(':id/award')
  @ApiOperation({ summary: 'give an award to a tutor' })
  async giveAwardToTutor(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() req: GiveAwardRequestDto,
  ): Promise<GiveAwardResponseDto> {
    const tutor = await this.tutorService.findByUserId(id);
    if (!tutor) return { error: GiveAwardError.NO_SUCH_TUTOR };
    if (
      !(await this.tutorService.hasPermission(currentUser, tutor, Role.ADMIN))
    )
      return { error: GiveAwardError.PERMISSION_DENIED };
    if (!tutor.isGraduate) return { error: GiveAwardError.NOT_GRADUATED };
    const award = await this.awardService.create(tutor, req);
    return {
      award: TutorAwardService.toDto(award),
      profile: await this.tutorService.filterProfile(tutor, currentUser),
    };
  }

  @Get(':id/award')
  @ApiOperation({ summary: 'Get all awards of a tutor' })
  async getAwardsOfTutor(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
  ): Promise<GetAwardResponseDto> {
    const tutor = await this.tutorService.findByUserId(id);
    if (!tutor) return { error: GetAwardError.NO_SUCH_TUTOR };
    if (
      !(await this.tutorService.hasPermission(currentUser, tutor, Role.ADMIN))
    )
      return { error: GetAwardError.PERMISSION_DENIED };
    const awards = (await this.awardService.findAllByTutorId(id)).map((award) =>
      TutorAwardService.toDto(award),
    );
    return { awards };
  }

  @ApiTags('LIST')
  @Get('')
  @ApiOperation({ summary: 'Get tutor list' })
  async getTutors(
    @CurrentUser() currentUser: UserEntity,
    @Query() query: GetTutorsRequestDto,
  ): Promise<GetTutorsResponseDto> {
    // validate permission
    function hasPermission(): boolean {
      const currentRole = query.currentRole;
      if (!currentUser) return false;
      if (currentUser.isRoot) return true;
      if (!hasRole(currentUser, currentRole)) return false;
      return [Role.HRBP, Role.ADMIN].includes(currentRole);
    }

    if (!hasPermission()) return { error: GetTutorsError.PERMISSION_DENIED };

    // validate query
    if (query.take > 100) return { error: GetTutorsError.TAKE_TOO_MANY };
    const divisionIds = await this.permissionService.filterPermissions(
      currentUser,
      query.currentRole,
      await this.divisionService.findById(query.divisionId),
    );
    if (query.divisionId && divisionIds.length === 0)
      return { error: GetTutorsError.INVALID_DIVISION };
    if (query.cityId && !(await this.cityService.validate(query.cityId)))
      return { error: GetTutorsError.INVALID_CITY };

    // get data
    const [list, count] = await this.tutorService.getList(
      query.skip,
      query.take,
      {
        cityId: query.cityId,
        divisionIds: divisionIds,
        searchRealname: query.keyword
          ? {
              keyword: query.keyword,
              wildcard: query.wildcard || WildcardType.END,
            }
          : undefined,
        isApproved: statusToIsApproved(query.status),
        isGraduate: statusToIsGraduate(query.status),
        pendingFirst: query.pendingFirst,
      },
    );

    return {
      tutors: await Promise.all(
        list.map((entity) =>
          this.tutorService.filterProfile(entity, currentUser),
        ),
      ),
      count,
    };
  }

  /**
   * 管理员查看数据看板所需的数据
   * @param currentUser
   * @param query
   */
  @ApiTags('DATA-SHOW')
  @Get('data-show')
  @ApiOperation({ summary: 'Get data-show of tutor.' })
  async getTutorDataShow(
    @CurrentUser() currentUser: UserEntity,
    @Query() query: GetTutorDataShowRequestDto,
  ): Promise<GetTutorDataShowResponseDto> {
    function hasPermission(): boolean {
      return (
        currentUser && (currentUser.isRoot || hasRole(currentUser, Role.ADMIN))
      );
    }

    if (!hasPermission())
      return { error: GetTutorDataShowError.PERMISSION_DENIED };
    if (query.startTime == null || query.endTime == null)
      return { error: GetTutorDataShowError.INVALID_TIME_RANGE };
    const timeRange = {
      startTime: startOfMonth(new Date(query.startTime)),
      endTime: endOfMonth(new Date(query.endTime)),
    };
    if (timeRange.startTime > timeRange.endTime)
      return { error: GetTutorDataShowError.INVALID_TIME_RANGE };
    if (differenceInMonths(timeRange.startTime, timeRange.endTime) >= 12)
      return { error: GetTutorDataShowError.TAKE_TOO_MANY_MONTHS };
    const divisionIds = currentUser.isRoot
      ? (await this.divisionService.getList()).map((division) => division.id)
      : await this.permissionService.filterPermissions(currentUser, Role.ADMIN);
    return await this.tutorService.getDataShow({ divisionIds, timeRange });
  }
}
