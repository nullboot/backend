import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExamService } from './exam.service';
import { CurrentUser } from '../common/user.decorator';
import { IntParam } from '../common/validators';
import {
  CreateExamError,
  CreateExamRequestDto,
  CreateExamResponseDto,
  DeleteExamError,
  DeleteExamResponseDto,
  GetExamError,
  GetExamResponseDto,
  GetExamsError,
  GetExamsRequestDto,
  GetExamsResponseDto,
  ParseExamCsvFileError,
  ParseExamCsvFileRequestDto,
  ParseExamCsvFileResponseDto,
  UpdateExamError,
  UpdateExamRequestDto,
  UpdateExamResponseDto,
} from './dto';
import { hasRoleOrRoot, Role } from '../common/role';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'node-xlsx';
import { parseProblem } from './exam.entity';
import { Response } from 'express';
import { join } from 'path';
import { WildcardType } from '../common/dto';

@ApiTags('TRAINING::Exam')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get('template')
  @ApiOperation({ summary: '下载考试模板', description: '登录的用户均可下载' })
  async getExamTemplate(@CurrentUser() currentUser, @Res() res: Response) {
    if (!currentUser) return res.status(401).send('unauthorized');

    res.download(
      join(__dirname, '../../assets', 'exam-template.csv'),
      async (err) => {
        if (err) {
          Logger.log(err, 'ExamController');
          return res.status(500).send('internal server error');
        }
      },
    );
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '考试模板文件，格式为 `csv`',
    type: ParseExamCsvFileRequestDto,
  })
  @ApiOperation({
    summary: '解析考试模板',
    description: '解析上传的考试模板文件，返回从中解析出的题目',
  })
  async parseExamCsvFile(
    @CurrentUser() currentUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ParseExamCsvFileResponseDto> {
    if (!currentUser) return { error: ParseExamCsvFileError.PERMISSION_DENIED };

    const [titleLine, ...data] = xlsx.parse(file.buffer)[0].data;
    if ((titleLine as any[])?.length <= 5)
      return { error: ParseExamCsvFileError.INVALID_FILE_FORMAT };

    const problems = data.map(parseProblem);
    if (problems.some((problem) => !problem))
      return { error: ParseExamCsvFileError.INVALID_FILE_FORMAT };
    if (!ExamService.validateRequestProblems(problems))
      return { error: ParseExamCsvFileError.INVALID_FILE_FORMAT };

    return { problems };
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取考试信息',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getExam(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<GetExamResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetExamError.PERMISSION_DENIED };

    const exam = await this.examService.findById(id, true);
    if (!exam) return { error: GetExamError.NO_SUCH_EXAM };

    return { exam: await this.examService.toDto(exam, currentUser) };
  }

  /**
   * NOTE:
   * We should put `POST new` BEFORE `POST :id`.
   * Otherwise Express will process `POST new` as `POST :id` as id = 'new'.
   */
  @Post('new')
  @ApiOperation({
    summary: '创建考试',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async createExam(
    @CurrentUser() currentUser,
    @Body() body: CreateExamRequestDto,
  ): Promise<CreateExamResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: CreateExamError.PERMISSION_DENIED };
    if (!ExamService.validateRequestProblems(body.problems))
      return { error: CreateExamError.INVALID_ANSWER };

    const exam = await this.examService.create(body, currentUser);
    return { exam: await this.examService.toDto(exam, currentUser) };
  }

  @Post(':id')
  @ApiOperation({
    summary: '更新考试信息',
    description: '只有 ADMIN 和 ROOT 具有权限；ADMIN 只能更新自己创建的课程',
  })
  async updateExam(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
    @Body() body: UpdateExamRequestDto,
  ): Promise<UpdateExamResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: UpdateExamError.PERMISSION_DENIED };
    let exam = await this.examService.findById(id);
    if (!exam) return { error: UpdateExamError.NO_SUCH_EXAM };
    if (currentUser.id !== exam.ownerId && !currentUser.isRoot)
      return { error: UpdateExamError.PERMISSION_DENIED };

    if (!ExamService.validateRequestProblems(body.problems))
      return { error: UpdateExamError.INVALID_ANSWER };

    exam = await this.examService.update(exam, body);
    return { exam: await this.examService.toDto(exam, currentUser) };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除考试',
    description:
      '只有 ADMIN 和 ROOT 具有权限；考试未被使用时才能删除；ADMIN 只能删除自己创建的考试',
  })
  async deleteExam(
    @CurrentUser() currentUser,
    @IntParam('id') id: number,
  ): Promise<DeleteExamResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: DeleteExamError.PERMISSION_DENIED };
    const exam = await this.examService.findById(id);
    if (!exam) return { error: DeleteExamError.NO_SUCH_EXAM };
    if (currentUser.id !== exam.ownerId && !currentUser.isRoot)
      return { error: DeleteExamError.PERMISSION_DENIED };
    if (exam.isUsed) return { error: DeleteExamError.ALREADY_USED };

    await this.examService.delete(exam);

    return {};
  }

  @ApiTags('LIST')
  @Get('')
  @ApiOperation({
    summary: '获取考试列表',
    description: '只有 ADMIN 和 ROOT 具有权限',
  })
  async getExams(
    @CurrentUser() currentUser,
    @Query() req: GetExamsRequestDto,
  ): Promise<GetExamsResponseDto> {
    if (!hasRoleOrRoot(currentUser, Role.ADMIN))
      return { error: GetExamsError.PERMISSION_DENIED };

    if (req.take > 100) return { error: GetExamsError.TAKE_TOO_MANY };

    const [list, count] = await this.examService.getList(req.skip, req.take, {
      search: req.keyword
        ? { keyword: req.keyword, wildcard: req.wildcard || WildcardType.BOTH }
        : undefined,
      ownerId: req.ownerId,
      tag: req.tag,
    });

    return {
      exams: await Promise.all(
        list.map((exam) => this.examService.toDto(exam, currentUser)),
      ),
      count,
    };
  }
}
