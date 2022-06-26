import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import {
  DoneFileUploadError,
  DoneFileUploadRequestDto,
  DoneFileUploadResponseDto,
  SignFileUploadError,
  SignFileUploadRequestDto,
  SignFileUploadResponseDto,
} from './dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/user.decorator';
import { hasRoleOrRoot, Role } from '../common/role';
import { UserEntity } from '../user/user.entity';

@ApiTags('FILE', 'ROLE::Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload/sign')
  @ApiOperation({ summary: 'Sign file upload link.' })
  async signFileUpload(
    @CurrentUser() currentUser: UserEntity,
    @Body() body: SignFileUploadRequestDto,
  ): Promise<SignFileUploadResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: SignFileUploadError.PERMISSION_DENIED };

    // limit: 1GB
    if (body.size > 1024 * 1024 * 1024)
      return { error: SignFileUploadError.FILE_TOO_LARGE };

    return {
      signedRequest: await this.fileService.sign(body.size),
    };
  }

  @Post('upload/done')
  @ApiOperation({ summary: 'Report file uploaded.' })
  async doneFileUpload(
    @CurrentUser() currentUser: UserEntity,
    @Body() body: DoneFileUploadRequestDto,
  ): Promise<DoneFileUploadResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: DoneFileUploadError.PERMISSION_DENIED };

    const [file, error] = await this.fileService.create(body.uuid, body.size);
    if (error) return { error };

    return { fileInfo: await this.fileService.getFileInfo(file) };
  }
}
