import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CourseSectionEntity,
  CourseSectionType,
} from './course-section.entity';
import { In, Repository } from 'typeorm';
import {
  CourseSectionDto,
  CourseSectionForTraineeDto,
  CourseSectionRequestDto,
} from './dto';
import { FileService } from '../file/file.service';
import { TrainingSectionDto, WildcardType } from '../common/dto';

@Injectable()
export class CourseSectionService {
  constructor(
    @InjectRepository(CourseSectionEntity)
    private readonly sectionRepository: Repository<CourseSectionEntity>,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
  ) {}

  async findById(id: number): Promise<CourseSectionEntity> {
    const query = this.sectionRepository
      .createQueryBuilder('section')
      .where('section.id = :sectionId', { sectionId: id })
      .leftJoinAndSelect('section.file', 'file');
    return await query.getOne();
  }

  async findByIds(ids: number[]): Promise<Map<number, CourseSectionEntity>> {
    if (!ids?.length) return new Map();
    const query = this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.file', 'file')
      .where('section.id IN (:...sectionIds)', { sectionIds: ids });
    const sections = await query.getMany();
    return new Map(sections.map((section) => [section.id, section]));
  }

  async getDtoByIds(sectionIds: number[]): Promise<CourseSectionDto[]> {
    const sections = await this.findByIds(sectionIds);
    return await Promise.all(
      sectionIds.map((id) => this.toDto(sections.get(id))),
    );
  }

  async toDto(section: CourseSectionEntity): Promise<CourseSectionDto> {
    if (!section) return null;
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      type: section.type,
      filename: section.filename,
      fileInfo: section.file
        ? await this.fileService.getFileInfo(section.file, section.filename)
        : await this.fileService.getFileInfoById(
            section.fileId,
            section.filename,
          ),
      isUsed: section.isUsed,
    };
  }

  async checkExistenceByIds(ids: number[]): Promise<boolean> {
    return (await this.sectionRepository.count({ id: In(ids) })) === ids.length;
  }

  async create(body: CourseSectionRequestDto): Promise<CourseSectionEntity> {
    return this.sectionRepository.save(body);
  }

  async update(
    section: CourseSectionEntity,
    body: CourseSectionRequestDto,
  ): Promise<CourseSectionEntity> {
    section.title = body.title;
    section.description = body.description;
    section.type = body.type;
    if (section.fileId !== body.fileId) {
      section.file
        ? await this.fileService.delete(section.file)
        : await this.fileService.deleteById(section.fileId);
      section.fileId = body.fileId;
    }
    section.filename = body.filename;
    return this.sectionRepository.save(section);
  }

  async delete(section: CourseSectionEntity) {
    section.file
      ? await this.fileService.delete(section.file)
      : await this.fileService.deleteById(section.fileId);
    await this.sectionRepository.remove(section);
  }

  async getList(
    skip: number,
    take: number,
    {
      search,
      type,
    }: {
      search?: { keyword: string; wildcard?: WildcardType };
      type?: CourseSectionType;
    } = {},
  ): Promise<[list: CourseSectionEntity[], count: number]> {
    const query = this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.file', 'file')
      .skip(skip)
      .take(take);
    if (search) {
      if (search.wildcard === WildcardType.NONE)
        query.andWhere('section.title = :keyword', { keyword: search.keyword });
      else {
        let keyword = search.keyword;
        if (search.wildcard === WildcardType.BOTH) keyword = `%${keyword}%`;
        else if (search.wildcard === WildcardType.BEGIN)
          keyword = `%${keyword}`;
        else if (search.wildcard === WildcardType.END) keyword = `${keyword}%`;
        query.andWhere('section.title LIKE :keyword', { keyword });
      }
    }
    if (type != null) query.andWhere('section.type = :type', { type });

    return await query.getManyAndCount();
  }

  async getDtoForTraineeByIds(
    sections: TrainingSectionDto[],
  ): Promise<CourseSectionForTraineeDto[]> {
    const map = await this.findByIds(sections.map((s) => s.id));
    const fileInfoList = await Promise.all(
      sections.map((ts) => {
        const section = map.get(ts.id);
        return this.fileService.getFileInfo(section.file, section.filename);
      }),
    );
    return sections.map((ts, index) => {
      const section = map.get(ts.id);
      const fileInfo = fileInfoList[index];
      return {
        title: section.title,
        description: section.description,
        type: section.type,
        filename: section.filename,
        downloadLink: fileInfo?.downloadLink,
        finished: ts.finished,
      };
    });
  }

  async markAsUsed(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const res = await this.sectionRepository.update(
      { id: In(ids) },
      { isUsed: true },
    );
    if (res.affected !== ids.length)
      Logger.error(
        `Only Mark ${res.affected} of ${ids.length} as used.`,
        'CourseSectionService',
      );
    return;
  }
}
