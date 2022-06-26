import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateDivisionError, DivisionDto, UpdateDivisionError } from './dto';
import { DivisionEntity } from './tag-division.entity';
import { TemplateService } from '../template/template.service';
import { TemplateType } from '../template/template.entity';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(DivisionEntity)
    private readonly divisionRepository: Repository<DivisionEntity>,
    @Inject(forwardRef(() => TemplateService))
    private readonly templateService: TemplateService,
  ) {}

  async findById(id: number): Promise<DivisionEntity> {
    return await this.divisionRepository.findOne({ id });
  }

  async findByName(name: string): Promise<DivisionEntity> {
    return await this.divisionRepository.findOne({ name });
  }

  static toDto(division: DivisionEntity): DivisionDto {
    return { id: division.id, name: division.name };
  }

  async getDtoById(id: number): Promise<DivisionDto> {
    if (id == null) return null;
    const division = await this.findById(id);
    return DivisionService.toDto(division);
  }

  async getList(): Promise<DivisionEntity[]> {
    return await this.divisionRepository.find({});
  }

  async create(name: string): Promise<[CreateDivisionError, DivisionEntity]> {
    if (await this.findByName(name))
      return [CreateDivisionError.DUPLICATE_DIVISION_NAME, null];
    const division = await this.divisionRepository.save({ name });
    await this.templateService.create(TemplateType.NEWBIE, division);
    await this.templateService.create(TemplateType.TUTOR, division);
    return [null, division];
  }

  async delete(division: DivisionEntity) {
    await this.divisionRepository.remove(division); // Templates will be deleted automatically (on delete CASCADE)
  }

  async update(
    division: DivisionEntity,
    name: string,
  ): Promise<[UpdateDivisionError, DivisionEntity]> {
    if (name !== division.name && (await this.findByName(name)))
      return [UpdateDivisionError.DUPLICATE_DIVISION_NAME, null];
    division.name = name;
    division = await this.divisionRepository.save(division);
    return [null, division];
  }

  async validate(id: number): Promise<boolean> {
    return id != null && (await this.divisionRepository.count({ id })) > 0;
  }

  async checkExistenceByIds(ids: number[]): Promise<boolean> {
    return (
      (await this.divisionRepository.count({ id: In(ids) })) === ids.length
    );
  }
}
