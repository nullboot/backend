import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NewbieCommentEntity,
  NewbieCommentType,
} from './newbie-comment.entity';
import { Repository } from 'typeorm';
import {
  NewbieCommentDto,
  NewbieCommentRequestDto,
} from './dto/newbie-comment.dto';
import { NewbieEntity } from './newbie.entity';
import { FilterByDivision } from '../common/user.filter';
import { endOfMonth } from 'date-fns';

@Injectable()
export class NewbieCommentService {
  constructor(
    @InjectRepository(NewbieCommentEntity)
    private readonly commentRepository: Repository<NewbieCommentEntity>,
  ) {}

  async findById(
    id: number,
    type: NewbieCommentType = NewbieCommentType.TutorRecord,
  ): Promise<NewbieCommentEntity> {
    return await this.commentRepository.findOne({ id, type });
  }

  async findOneByNewbieId(
    newbieId: number,
    type: NewbieCommentType,
  ): Promise<NewbieCommentEntity> {
    return await this.commentRepository.findOne({ newbieId, type });
  }

  async findAllByNewbieId(
    newbieId: number,
    type: NewbieCommentType = NewbieCommentType.TutorRecord,
  ): Promise<NewbieCommentEntity[]> {
    return await this.commentRepository.find({ newbieId, type });
  }

  async update(
    comment: NewbieCommentEntity,
    req: NewbieCommentRequestDto,
  ): Promise<NewbieCommentEntity> {
    comment.content = req.content;
    if (req.type !== NewbieCommentType.TutorRecord) comment.score = req.score;
    return await this.commentRepository.save(comment);
  }

  async create(
    newbie: NewbieEntity,
    req: NewbieCommentRequestDto,
  ): Promise<NewbieCommentEntity> {
    return await this.commentRepository.save({
      content: req.content,
      type: req.type,
      score: req.type !== NewbieCommentType.TutorRecord ? req.score : null,
      newbie,
    });
  }

  async delete(comment: NewbieCommentEntity): Promise<void> {
    await this.commentRepository.remove(comment);
  }

  static toDto(comment: NewbieCommentEntity): NewbieCommentDto {
    return {
      id: comment.id,
      content: comment.content,
      score: comment.score,
      updateTime: comment.updateTime,
    };
  }

  async getAverageScore({
    beforeMonth,
    divisionIds,
    type,
  }: {
    beforeMonth: Date;
    divisionIds?: number[];
    type: NewbieCommentType;
  }): Promise<number> {
    if (type == NewbieCommentType.TutorRecord) return null;
    const query = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.newbie', 'newbie')
      .leftJoin('newbie.user', 'user')
      .andWhere('comment.type = :type', { type });
    if (divisionIds) FilterByDivision(query, divisionIds);
    const { avg } = await query
      .andWhere('newbie.isExist = true')
      .andWhere('newbie.isGraduate = true')
      .andWhere('newbie.graduationTime <= :date', {
        date: endOfMonth(beforeMonth),
      })
      .addSelect('AVG(comment.score)', 'avg')
      .getRawOne();
    return Number(avg || 0);
  }

  async findByNewbieIds(
    ids: number[],
    type: NewbieCommentType = NewbieCommentType.TutorToNewbie,
  ): Promise<NewbieCommentEntity[]> {
    if (ids.length === 0) return [];
    const query = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.type = :type', { type })
      .andWhere('comment.newbieId IN (:...ids)', { ids });
    const list = await query.getMany();
    const map = new Map<number, NewbieCommentEntity>(
      list.map((item) => [item.newbieId, item]),
    );
    return ids.map((id) => map.get(id) ?? null);
  }
}
