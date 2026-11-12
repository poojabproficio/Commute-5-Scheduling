import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Campus } from '../../campus/entities/campus.entity.js';


/** One set of scheduling settings belongs to one campus. */
@Entity('schedule')

export class Schedule extends BaseAuditEntity {
  @Column({ name: 'campus_id', type: 'int' })
  campusId!: number;

  @OneToOne(() => Campus, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'campus_id', referencedColumnName: 'id' })
  campus!: Campus;


  @Column({ name: 'works_mon', type: 'bit', default: true }) worksMon!: boolean;
  @Column({ name: 'works_tue', type: 'bit', default: true }) worksTue!: boolean;
  @Column({ name: 'works_wed', type: 'bit', default: true }) worksWed!: boolean;
  @Column({ name: 'works_thu', type: 'bit', default: true }) worksThu!: boolean;
  @Column({ name: 'works_fri', type: 'bit', default: true }) worksFri!: boolean;
  @Column({ name: 'works_sat', type: 'bit', default: false }) worksSat!: boolean;
  @Column({ name: 'works_sun', type: 'bit', default: false }) worksSun!: boolean;

  @Column({ name: 'min_working_days_per_week', type: 'tinyint', default: 4 })
  minWorkingDaysPerWeek!: number;
  @Column({ name: 'block_weekends', type: 'bit', default: true }) blockWeekends!: boolean;
  @Column({ name: 'block_holidays', type: 'bit', default: true }) blockHolidays!: boolean;
  @Column({ name: 'interlock_login_logout', type: 'bit', default: false }) interlockLoginLogout!: boolean;
  @Column({ name: 'max_advance_days', type: 'smallint', default: 14 }) maxAdvanceDays!: number;
  @Column({ name: 'allow_sat_for_monday', type: 'bit', default: false }) allowSatForMonday!: boolean;
  @Column({ name: 'allow_sun_for_monday', type: 'bit', default: false }) allowSunForMonday!: boolean;

  @Column({ name: 'weekly_cutoff_enabled', type: 'bit', default: false }) weeklyCutoffEnabled!: boolean;
  @Column({ name: 'weekly_cutoff_day', type: 'tinyint', nullable: true }) weeklyCutoffDay!: number | null;
  @Column({ name: 'weekly_cutoff_time', type: 'time', nullable: true }) weeklyCutoffTime!: string | null;
  @Column({ name: 'daily_cutoff_enabled', type: 'bit', default: false }) dailyCutoffEnabled!: boolean;
  @Column({ name: 'daily_cutoff_type', type: 'varchar', length: 20, nullable: true }) dailyCutoffType!: 'TIME_OF_DAY' | 'HOURS_PRIOR' | null;
  @Column({ name: 'daily_cutoff_day_offset', type: 'tinyint', nullable: true }) dailyCutoffDayOffset!: number | null;
  @Column({ name: 'daily_cutoff_time', type: 'time', nullable: true }) dailyCutoffTime!: string | null;
  @Column({ name: 'login_hours_prior', type: 'smallint', nullable: true }) loginHoursPrior!: number | null;
  @Column({ name: 'logout_hours_prior', type: 'smallint', nullable: true }) logoutHoursPrior!: number | null;
 @Column({
  name: 'login_minutes_prior',
  type: 'smallint',
  nullable: true,
})
loginMinutesPrior!: number | null;

@Column({
  name: 'logout_minutes_prior',
  type: 'smallint',
  nullable: true,
})
logoutMinutesPrior!: number | null;
  @Column({ name: 'interlock_schedule_adhoc', type: 'bit', default: false }) interlockScheduleAdhoc!: boolean;
  @Column({ name: 'revoke_cancellation', type: 'bit', default: false }) revokeCancellation!: boolean;
  @Column({ name: 'send_email_confirmation', type: 'bit', default: false }) sendEmailConfirmation!: boolean;
  @Column({ name: 'approval_enabled', type: 'bit', default: false }) approvalEnabled!: boolean;
  @Column({ name: 'approver_scope', type: 'varchar', length: 20, nullable: true }) approverScope!: 'REPORTING_CHAIN' | 'ANY_FROM_LIST' | null;

}
