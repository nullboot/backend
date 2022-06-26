import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TutorAwardEntity } from './tutor-award.entity';
import { Repository } from 'typeorm';
import { TutorEntity } from './tutor.entity';
import { GiveAwardRequestDto } from './dto';
import { TutorAwardDto } from './dto';

@Injectable()
export class TutorAwardService {
  constructor(
    @InjectRepository(TutorAwardEntity)
    private readonly awardRepository: Repository<TutorAwardEntity>,
  ) {}

  async findById(id: number): Promise<TutorAwardEntity> {
    return await this.awardRepository.findOne({ id });
  }

  async findAllByTutorId(tutorId: number): Promise<TutorAwardEntity[]> {
    return await this.awardRepository.find({ tutorId });
  }

  async create(
    tutor: TutorEntity,
    req: GiveAwardRequestDto,
  ): Promise<TutorAwardEntity> {
    return await this.awardRepository.save({
      title: req.title,
      description: req.description,
      level: req.level,
      tutor,
    });
  }

  static toDto(award: TutorAwardEntity): TutorAwardDto {
    return {
      achieveTime: award.achieveTime,
      description: award.description,
      id: award.id,
      level: award.level,
      title: award.title,
    };
  }
}
