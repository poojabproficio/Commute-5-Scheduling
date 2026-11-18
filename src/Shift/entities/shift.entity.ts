
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Campus } from '../../campus/entities/campus.entity.js';

export enum ShiftType {
  REGULAR = 'regular',
  ADHOC = 'adhoc',
}

export enum ShiftDirection {
  LOGIN = 'login',
  LOGOUT = 'logout',
}

@Entity('Shift')
export class Shift extends BaseAuditEntity {
  @ManyToOne(() => Campus, {
    nullable: false,
  })
  @JoinColumn({ name: 'campus_id' })
  campus!: Campus;

  @Column({
    name: 'shift_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shiftName!: string | null;

  @Column({
    name: 'buffer_time',
    type: 'int',
  })
  bufferTime!: number;

  @Column({
    name: 'shift_type',
    type: 'varchar',
    length: 20,
  })
  shiftType!: ShiftType;

  @Column({
    name: 'shift_direction',
    type: 'varchar',
    length: 20,
  })
  shiftDirection!: ShiftDirection;

  @Column({
    name: 'cab_time',
    type: 'varchar',
    length: 5,
  })
  cabTime!: string;

  @Column({
    name: 'cancellation_cutoff_mins',
    type: 'int',
  })
  cancellationCutoffMins!: number;

  @Column({
    name: 'request_cutoff_mins',
    type: 'int',
    nullable: true,
  })
  requestCutoffMins!: number | null;
}
