import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * `FileEntity`: 数据库 file 表中的实体
 */
@Entity('file')
export class FileEntity {
  /**
   * 文件ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 文件标识符（MinIO）
   */
  @Column({ type: 'char', length: 36 })
  @Index({ unique: true })
  uuid: string;

  /**
   * 文件大小
   */
  @Column({ type: 'integer' })
  size: number;

  /**
   * 上传时间
   */
  @Column({ type: 'datetime' })
  uploadTime: Date;
}
