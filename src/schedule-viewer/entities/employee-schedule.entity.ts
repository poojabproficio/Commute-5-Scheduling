
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

import { User } from '../../user/entities/user.entity.js';
import { Employee } from '../../Employee/entities/employee.entity.js';
import { Shift } from '../../Shift/entities/shift.entity.js';

export enum ScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
}

export enum ScheduleSource {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  UPLOAD = 'UPLOAD',
  APPROVAL = 'APPROVAL',
}

@Entity('employee_schedule')
@Index(
  'UQ_employee_schedule_employee_login_date',
  ['employee', 'loginDate'],
  {
    unique: true,
    where: 'deleted_at IS NULL',
  },
)
export class EmployeeSchedule extends BaseAuditEntity {
  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'login_date', type: 'date' })
  loginDate!: string;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'login_shift_id' })
  loginShift!: Shift | null;

  @Column({
    name: 'login_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  loginStatus!: ScheduleStatus | null;

  @Column({
    name: 'login_source',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  loginSource!: ScheduleSource | null;

  @Column({ name: 'login_updated_at', type: 'datetime2', nullable: true })
  loginUpdatedAt!: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'login_updated_by' })
  loginUpdatedBy!: User | null;

  @Column({
    name: 'login_override_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  loginOverrideReason!: string | null;

  @Column({ name: 'logout_date', type: 'date', nullable: true })
  logoutDate!: string | null;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'logout_shift_id' })
  logoutShift!: Shift | null;

  @Column({
    name: 'logout_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  logoutStatus!: ScheduleStatus | null;

  @Column({
    name: 'logout_source',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  logoutSource!: ScheduleSource | null;

  @Column({ name: 'logout_updated_at', type: 'datetime2', nullable: true })
  logoutUpdatedAt!: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'logout_updated_by' })
  logoutUpdatedBy!: User | null;

  @Column({
    name: 'logout_override_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  logoutOverrideReason!: string | null;
}
