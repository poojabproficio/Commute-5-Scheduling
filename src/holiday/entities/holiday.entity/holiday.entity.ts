
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseAuditEntity } from '../../../common/entities/base.audit.entity.js';
import { Campus } from '../../../campus/entities/campus.entity.js';

// Allowed holiday classifications
export type HolidayType =
  | 'NATIONAL'
  | 'REGIONAL'
  | 'COMPANY'
  | 'OPTIONAL';

@Entity('holiday_calendar')
export class Holiday extends BaseAuditEntity {

  // CAMPUS RELATIONSHIP

  @Column({
    name: 'campus_id',
    type: 'int',
  })
  campusId!: number;

  @ManyToOne(() => Campus, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'campus_id',
    referencedColumnName: 'id',
  })
  campus!: Campus;

  // HOLIDAY NAME

  @Column({
    name: 'name',
    type: 'varchar',
    length: 150,
  })
  name!: string;

  // HOLIDAY DATE

  @Column({
    name: 'date',
    type: 'date',
  })
  date!: string;

  // HOLIDAY CLASSIFICATION

  @Column({
    name: 'holiday_type',
    type: 'varchar',
    length: 20,
  })
  holidayType!: HolidayType;

  // RECURRING HOLIDAY

  @Column({
    name: 'is_recurring',
    type: 'bit',
    default: false,
  })
  isRecurring!: boolean;

  // BLOCK SCHEDULING

  @Column({
    name: 'block_scheduling',
    type: 'bit',
    default: true,
  })
  blockScheduling!: boolean;

  // NOTES

  @Column({
    name: 'notes',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  notes!: string | null;
}
