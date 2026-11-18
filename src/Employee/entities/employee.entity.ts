
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Campus } from '../../campus/entities/campus.entity.js';

@Entity('Employee')
export class Employee extends BaseAuditEntity {
  @ManyToOne(() => Campus, {
    nullable: false,
  })
  @JoinColumn({ name: 'campus_id' })
  campus!: Campus;

  @Column({
    name: 'employeeName',
    type: 'varchar',
    length: 150,
  })
  employeeName!: string;

  @Column({
    name: 'employeeId',
    type: 'varchar',
    length: 50,
  })
  employeeId!: string;
}
