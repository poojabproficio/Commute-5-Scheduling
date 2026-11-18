
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Employee } from '../../Employee/entities/employee.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { ScheduleRequestItem } from './schedule-request-item.entity.js';


export enum ScheduleRequestStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('schedule_request')
export class ScheduleRequest extends BaseAuditEntity {
  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'submitted_at', type: 'datetime2' })
  submittedAt!: Date;

  @Column({
    name: 'request_status',
    type: 'varchar',
    length: 20,
  })
  requestStatus!: ScheduleRequestStatus;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  failureReason!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'submitted_by' })
  submittedBy!: User | null;

  @OneToMany(
    () => ScheduleRequestItem,
    (item) => item.request,
  )
items!: Relation<ScheduleRequestItem[]>;
}
