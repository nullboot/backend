import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tag_city')
export class CityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;
}
