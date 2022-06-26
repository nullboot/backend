import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewbieService } from './newbie.service';
import { PermissionService } from '../permission/permission.service';
import { NewbieCommentService } from './newbie-comment.service';
import { CurrentUser } from '../common/user.decorator';
import { UserEntity } from '../user/user.entity';
import { IntParam } from '../common/validators';
import { NewbieCommentRequestDto } from './dto/newbie-comment.dto';
import {
  DeleteNewbieCommentError,
  DeleteNewbieCommentResponseDto,
  GetNewbieCommentError,
  GetNewbieCommentRequestDto,
  GetNewbieCommentResponseDto,
  UpdateNewbieCommentError,
  UpdateNewbieCommentResponseDto,
} from './dto';
import {
  NewbieCommentEntity,
  NewbieCommentType,
} from './newbie-comment.entity';
import { hasRole, Role } from '../common/role';

@ApiTags('ROLE::Newbie')
@ApiBearerAuth()
@Controller('newbie')
@UseGuards(AuthGuard('jwt'))
export class NewbieCommentController {
  constructor(
    private readonly newbieService: NewbieService,
    private readonly permissionService: PermissionService,
    private readonly newbieCommentService: NewbieCommentService,
  ) {}

  @Post(':id/comment')
  @ApiOperation({ summary: 'Update comment for newbie.' })
  async UpdateNewbieComment(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Body() body: NewbieCommentRequestDto,
  ): Promise<UpdateNewbieCommentResponseDto> {
    if (!currentUser)
      return { error: UpdateNewbieCommentError.PERMISSION_DENIED };
    let newbie = await this.newbieService.findByUserId(id);
    if (!newbie) return { error: UpdateNewbieCommentError.NO_SUCH_NEWBIE };
    // Only Newbie himself and ROOT can update NewbieToTutor comment
    // Only Newbie's Tutor and ROOT can update TutorToNewbie comment and TutorRecord
    if (!currentUser.isRoot) {
      if (body.type === NewbieCommentType.NewbieToTutor) {
        if (newbie.userId !== currentUser.id)
          return { error: UpdateNewbieCommentError.PERMISSION_DENIED };
      } else {
        if (
          !hasRole(currentUser, Role.TUTOR) ||
          newbie.tutorId !== currentUser.id
        )
          return { error: UpdateNewbieCommentError.PERMISSION_DENIED };
      }
    }
    if (!newbie.isAssigned)
      return { error: UpdateNewbieCommentError.NEWBIE_NOT_ASSIGNED };
    if (body.type === NewbieCommentType.NewbieToTutor && newbie.isGraduate)
      return { error: UpdateNewbieCommentError.NEWBIE_GRADUATED };
    // NewbieToTutor and TutorToNewbie comment require score
    if (body.type !== NewbieCommentType.TutorRecord && body.score == null)
      return { error: UpdateNewbieCommentError.REQUIRE_SCORE };

    let comment: NewbieCommentEntity = null;
    if (body.type !== NewbieCommentType.TutorRecord) {
      comment = await this.newbieCommentService.findOneByNewbieId(
        newbie.userId,
        body.type,
      );
    } else if (body.recordId != null) {
      comment = await this.newbieCommentService.findById(body.recordId);
      if (!comment) return { error: UpdateNewbieCommentError.NO_SUCH_RECORD };
    }

    if (comment != null)
      comment = await this.newbieCommentService.update(comment, body);
    else comment = await this.newbieCommentService.create(newbie, body);

    if (body.type === NewbieCommentType.NewbieToTutor) {
      newbie = await this.newbieService.checkGraduation(newbie);
      if (newbie.isGraduate)
        return {
          comment: NewbieCommentService.toDto(comment),
          profile: await this.newbieService.filterProfile(newbie, currentUser),
        };
    }

    return { comment: NewbieCommentService.toDto(comment) };
  }

  @Get(':id/comment')
  @ApiOperation({ summary: 'Get comment for newbie.' })
  async GetNewbieComment(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @Query() req: GetNewbieCommentRequestDto,
  ): Promise<GetNewbieCommentResponseDto> {
    if (!currentUser) return { error: GetNewbieCommentError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id, true);
    if (!newbie) return { error: GetNewbieCommentError.NO_SUCH_NEWBIE };
    if (!(await this.newbieService.hasPermission(currentUser, newbie)))
      return { error: GetNewbieCommentError.PERMISSION_DENIED };

    // Only Newbie himself, ADMIN, HRBP and ROOT can get NewbieToTutor comment
    if (
      !currentUser.isRoot &&
      !(await this.permissionService.hasPermission(
        currentUser,
        undefined,
        newbie.user.divisionId,
      ))
    ) {
      if (req.type === NewbieCommentType.NewbieToTutor) {
        if (newbie.userId !== currentUser.id)
          return { error: GetNewbieCommentError.PERMISSION_DENIED };
      } else {
        if (
          !hasRole(currentUser, Role.TUTOR) ||
          newbie.tutorId !== currentUser.id
        )
          return { error: GetNewbieCommentError.PERMISSION_DENIED };
      }
    }

    if (!newbie.isAssigned)
      return { error: GetNewbieCommentError.NEWBIE_NOT_ASSIGNED };

    if (req.type === NewbieCommentType.TutorRecord) {
      const records = await this.newbieCommentService.findAllByNewbieId(
        newbie.userId,
      );
      return { comments: records.map(NewbieCommentService.toDto) };
    }

    const comment = await this.newbieCommentService.findOneByNewbieId(
      newbie.userId,
      req.type,
    );
    if (!comment) return { error: GetNewbieCommentError.NO_SUCH_COMMENT };

    return { comment: NewbieCommentService.toDto(comment) };
  }

  @Delete(':id/comment/:commentId')
  @ApiOperation({ summary: 'Delete comment for newbie.' })
  async deleteNewbieComment(
    @CurrentUser() currentUser: UserEntity,
    @IntParam('id') id: number,
    @IntParam('commentId') commentId: number,
  ): Promise<DeleteNewbieCommentResponseDto> {
    if (!currentUser)
      return { error: DeleteNewbieCommentError.PERMISSION_DENIED };
    const newbie = await this.newbieService.findByUserId(id);
    if (!newbie) return { error: DeleteNewbieCommentError.NO_SUCH_NEWBIE };
    if (!hasRole(currentUser, Role.TUTOR) || newbie.tutorId !== currentUser.id)
      return { error: DeleteNewbieCommentError.PERMISSION_DENIED };

    const comment = await this.newbieCommentService.findById(commentId);
    if (!comment) return { error: DeleteNewbieCommentError.NO_SUCH_COMMENT };
    if (comment.newbieId !== newbie.userId)
      return { error: DeleteNewbieCommentError.PERMISSION_DENIED };

    await this.newbieCommentService.delete(comment);
    return {};
  }
}
