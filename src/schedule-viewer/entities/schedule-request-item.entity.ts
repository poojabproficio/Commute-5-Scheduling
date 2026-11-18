
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

import { EmployeeSchedule } from './employee-schedule.entity.js';
import { Shift } from '../../Shift/entities/shift.entity.js';
import { ScheduleRequest } from './schedule-request.entity.js';

export enum ScheduleRequestType {
  LOGIN_CHANGE = 'LOGIN_CHANGE',
  LOGOUT_CHANGE = 'LOGOUT_CHANGE',
  CANCEL_LOGIN = 'CANCEL_LOGIN',
  CANCEL_LOGOUT = 'CANCEL_LOGOUT',
  CANCEL_DUTY = 'CANCEL_DUTY',
  ADD_DUTY = 'ADD_DUTY',
  CHANGE_DATE = 'CHANGE_DATE',
}

export enum ScheduleRequestItemStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('schedule_request_item')
export class ScheduleRequestItem extends BaseAuditEntity {
  @ManyToOne(
    () => ScheduleRequest,
    (request) => request.items,
    { nullable: false },
  )
  @JoinColumn({ name: 'request_id' })
  request!: Relation<ScheduleRequest>;

  @ManyToOne(() => EmployeeSchedule, { nullable: true })
  @JoinColumn({ name: 'employee_schedule_id' })
  employeeSchedule!: EmployeeSchedule | null;

  @Column({ name: 'login_date', type: 'date' })
  loginDate!: string;

  @Column({ name: 'original_login_date', type: 'date', nullable: true })
  originalLoginDate!: string | null;

  @Column({ name: 'requested_login_date', type: 'date', nullable: true })
  requestedLoginDate!: string | null;

  @Column({
    name: 'request_type',
    type: 'varchar',
    length: 30,
  })
  requestType!: ScheduleRequestType;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'original_login_shift_id' })
  originalLoginShift!: Shift | null;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'requested_login_shift_id' })
  requestedLoginShift!: Shift | null;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'original_logout_shift_id' })
  originalLogoutShift!: Shift | null;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'requested_logout_shift_id' })
  requestedLogoutShift!: Shift | null;

  @Column({
    name: 'original_login_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  originalLoginStatus!: string | null;

  @Column({
    name: 'original_logout_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  originalLogoutStatus!: string | null;

  @Column({
    name: 'item_status',
    type: 'varchar',
    length: 20,
  })
  itemStatus!: ScheduleRequestItemStatus;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  failureReason!: string | null;

  @Column({ name: 'processed_at', type: 'datetime2', nullable: true })
  processedAt!: Date | null;
}
