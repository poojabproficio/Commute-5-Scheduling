
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  created_by!: string;

  @Column({ nullable: true, length: 100 })
  updated_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;
}
