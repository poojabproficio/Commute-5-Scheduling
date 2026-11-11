
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class ScheduleDto {
  // ==============================
  // WORKING DAYS
  // ==============================

  @IsOptional()
  @IsBoolean()
  worksMon?: boolean;

  @IsOptional()
  @IsBoolean()
  worksTue?: boolean;

  @IsOptional()
  @IsBoolean()
  worksWed?: boolean;

  @IsOptional()
  @IsBoolean()
  worksThu?: boolean;

  @IsOptional()
  @IsBoolean()
  worksFri?: boolean;

  @IsOptional()
  @IsBoolean()
  worksSat?: boolean;

  @IsOptional()
  @IsBoolean()
  worksSun?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  minWorkingDaysPerWeek?: number;

  @IsOptional()
  @IsBoolean()
  blockWeekends?: boolean;

  @IsOptional()
  @IsBoolean()
  blockHolidays?: boolean;

  @IsOptional()
  @IsBoolean()
  interlockLoginLogout?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  maxAdvanceDays?: number;

  @IsOptional()
  @IsBoolean()
  allowSatForMonday?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSunForMonday?: boolean;

  // ==============================
  // WEEKLY CUTOFF CONFIGURATION
  // ==============================

  @IsOptional()
  @IsBoolean()
  weeklyCutoffEnabled?: boolean;

  @ValidateIf((o) => o.weeklyCutoffEnabled === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weeklyCutoffDay?: number | null;

  @ValidateIf((o) => o.weeklyCutoffEnabled === true)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  weeklyCutoffTime?: string | null;

  // ==============================
  // DAILY CUTOFF CONFIGURATION
  // ==============================

  @IsOptional()
  @IsBoolean()
  dailyCutoffEnabled?: boolean;

  @ValidateIf((o) => o.dailyCutoffEnabled === true)
  @IsIn(['TIME_OF_DAY', 'HOURS_PRIOR'])
  dailyCutoffType?: 'TIME_OF_DAY' | 'HOURS_PRIOR' | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  dailyCutoffDayOffset?: number | null;

  @ValidateIf(
    (o) =>
      o.dailyCutoffEnabled === true &&
      o.dailyCutoffType === 'TIME_OF_DAY',
  )
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  dailyCutoffTime?: string | null;

  @ValidateIf(
    (o) =>
      o.dailyCutoffEnabled === true &&
      o.dailyCutoffType === 'HOURS_PRIOR',
  )
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  loginHoursPrior?: number | null;

  @ValidateIf(
    (o) =>
      o.dailyCutoffEnabled === true &&
      o.dailyCutoffType === 'HOURS_PRIOR',
  )
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  logoutHoursPrior?: number | null;

  // ==============================
  // SCHEDULING BEHAVIOUR
  // ==============================

  @IsOptional()
  @IsBoolean()
  interlockScheduleAdhoc?: boolean;

  @IsOptional()
  @IsBoolean()
  revokeCancellation?: boolean;

  @IsOptional()
  @IsBoolean()
  sendEmailConfirmation?: boolean;

  // ==============================
  // APPROVAL CONFIGURATION
  // ==============================

  @IsOptional()
  @IsBoolean()
  approvalEnabled?: boolean;

  @IsOptional()
  @IsIn(['REPORTING_CHAIN', 'ANY_FROM_LIST'])
  approverScope?: 'REPORTING_CHAIN' | 'ANY_FROM_LIST' | null;


}
