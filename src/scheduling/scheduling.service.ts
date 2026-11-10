
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Schedule } from './entities/scheduling.entity.js';
import { Campus } from '../campus/entities/campus.entity.js';
import { ScheduleDto } from './dto/scheduling.dto.js';




// Working day properties
const workingDayFields = [
  'worksMon',
  'worksTue',
  'worksWed',
  'worksThu',
  'worksFri',
  'worksSat',
  'worksSun',
] as const;

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    @InjectRepository(Campus)
    private readonly campusRepository: Repository<Campus>,
  ) {}

  // ==========================================
  // GET AUTHENTICATED USER DETAILS
  // ==========================================

  private getUserDetails(user: any) {
    if (!user?.campusId) {
      throw new BadRequestException(
        'Campus information not found for logged-in user',
      );
    }

    if (!user?.username) {
      throw new BadRequestException(
        'Employee information not found for logged-in user',
      );
    }

    return {
      campusId: user.campusId,
      username: user.username,
    };
  }

  // ==========================================
  // GET SCHEDULE FOR CAMPUS
  // ==========================================

  async findForCampus(user: any): Promise<Schedule> {
    const { campusId } = this.getUserDetails(user);

    const schedule = await this.scheduleRepository.findOne({
      where: {
        campusId,
        deleted_at: IsNull(),
      },
    });

    if (!schedule) {
      throw new NotFoundException(
        'Schedule configuration not found for this campus',
      );
    }

    return schedule;
  }

  // ==========================================
  // CREATE SCHEDULE
  // ==========================================

 async createForCampus(
  dto: ScheduleDto,
  user: any,
): Promise<Schedule> {
    const { campusId, username } = this.getUserDetails(user);

    // 1. Check whether campus exists
    const campus = await this.campusRepository.findOne({
      where: {
        id: campusId,
        deleted_at: IsNull(),
      },
    });

    if (!campus) {
      throw new NotFoundException('Campus not found');
    }

    // 2. Check existing schedule, including soft-deleted records
    const existing = await this.scheduleRepository.findOne({
      where: { campusId },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(
        existing.deleted_at
          ? 'A schedule already exists for this campus but has been soft-deleted'
          : 'A schedule already exists for this campus',
      );
    }

    // 3. Initialize default configuration
    const defaultValues: Partial<Schedule> = {
      worksMon: true,
      worksTue: true,
      worksWed: true,
      worksThu: true,
      worksFri: true,
      worksSat: false,
      worksSun: false,

      minWorkingDaysPerWeek: 4,

      blockWeekends: true,
      blockHolidays: true,

      interlockLoginLogout: false,
      maxAdvanceDays: 14,

      allowSatForMonday: false,
      allowSunForMonday: false,

      weeklyCutoffEnabled: false,
      weeklyCutoffDay: null,
      weeklyCutoffTime: null,

      dailyCutoffEnabled: false,
      dailyCutoffType: null,
      dailyCutoffDayOffset: null,
      dailyCutoffTime: null,

      loginHoursPrior: null,
      logoutHoursPrior: null,

      interlockScheduleAdhoc: false,
      revokeCancellation: false,
      sendEmailConfirmation: false,

      approvalEnabled: false,
      approverScope: null,
    };

    // 4. Merge defaults with incoming request
    const schedule = this.scheduleRepository.create({
      ...defaultValues,
      ...dto,
      campusId,
      created_by: username,
      updated_by: username,
    });

    // 5. Validate complete configuration
    this.validateSchedule(schedule);

    // 6. Save record
    try {
      return await this.scheduleRepository.save(schedule);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'A schedule already exists for this campus',
        );
      }

      throw error;
    }
  }

  // ==========================================
  // UPDATE SCHEDULE
  // ==========================================

  async updateForCampus(
    dto: ScheduleDto,
    user: any,
  ): Promise<Schedule> {
    const { username } = this.getUserDetails(user);

    // 1. Fetch existing schedule for authenticated campus
    const schedule = await this.findForCampus(user);

    // 2. Apply partial updates
    Object.assign(schedule, dto);

    // 3. Clear irrelevant daily cutoff fields
    if (!schedule.dailyCutoffEnabled) {
      schedule.dailyCutoffType = null;
      schedule.dailyCutoffDayOffset = null;
      schedule.dailyCutoffTime = null;
      schedule.loginHoursPrior = null;
      schedule.logoutHoursPrior = null;
    } else if (schedule.dailyCutoffType === 'TIME_OF_DAY') {
      schedule.loginHoursPrior = null;
      schedule.logoutHoursPrior = null;
    } else if (schedule.dailyCutoffType === 'HOURS_PRIOR') {
      schedule.dailyCutoffTime = null;
    }

    // 4. Update audit information
    schedule.updated_by = username;

    // 5. Validate final merged configuration
    this.validateSchedule(schedule);

    // 6. Save changes
    return this.scheduleRepository.save(schedule);
  }

  // ==========================================
  // BUSINESS VALIDATIONS
  // ==========================================

  private validateSchedule(schedule: Schedule): void {
    // 1. Validate minimum working days
    const selectedDays = workingDayFields.filter(
      (field) => schedule[field] === true,
    ).length;

    if (
      schedule.minWorkingDaysPerWeek < 1 ||
      schedule.minWorkingDaysPerWeek > selectedDays
    ) {
      throw new BadRequestException(
        'Minimum working days per week cannot exceed the number of selected working days',
      );
    }

    // 2. Validate weekly cutoff
    if (schedule.weeklyCutoffEnabled) {
      if (
        schedule.weeklyCutoffDay == null ||
        schedule.weeklyCutoffDay < 1 ||
        schedule.weeklyCutoffDay > 7
      ) {
        throw new BadRequestException(
          'A valid weekly cutoff day (1-7) is required',
        );
      }

      if (
        !schedule.weeklyCutoffTime ||
        !this.isValidTime(schedule.weeklyCutoffTime)
      ) {
        throw new BadRequestException(
          'A valid weekly cutoff time is required',
        );
      }
    }

    // 3. Validate daily cutoff
    if (schedule.dailyCutoffEnabled) {
      if (!schedule.dailyCutoffType) {
        throw new BadRequestException(
          'Daily cutoff type is required when daily cutoff is enabled',
        );
      }

      if (schedule.dailyCutoffType === 'TIME_OF_DAY') {
        if (
          !schedule.dailyCutoffTime ||
          !this.isValidTime(schedule.dailyCutoffTime)
        ) {
          throw new BadRequestException(
            'A valid daily cutoff time is required for TIME_OF_DAY configuration',
          );
        }
      } else if (schedule.dailyCutoffType === 'HOURS_PRIOR') {
        if (
          schedule.loginHoursPrior == null ||
          schedule.logoutHoursPrior == null ||
          schedule.loginHoursPrior < 0 ||
          schedule.logoutHoursPrior < 0
        ) {
          throw new BadRequestException(
            'Valid login hours prior and logout hours prior are required for HOURS_PRIOR configuration',
          );
        }
      } else {
        throw new BadRequestException(
          'Invalid daily cutoff type',
        );
      }
    }

    // 4. Validate advance scheduling days
    if (schedule.maxAdvanceDays < 0) {
      throw new BadRequestException(
        'Maximum advance days cannot be negative',
      );
    }

    // 5. Validate approval configuration
    if (
      schedule.approvalEnabled &&
      !schedule.approverScope
    ) {
      throw new BadRequestException(
        'Approver scope is required when approval is enabled',
      );
    }

    // 6. Existing business restriction
    if (
      schedule.approvalEnabled &&
      schedule.dailyCutoffEnabled
    ) {
      throw new BadRequestException(
        'Approval cannot be enabled while daily cutoff is enabled',
      );
    }
  }

  // ==========================================
  // TIME FORMAT VALIDATION
  // ==========================================

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
  }

  // ==========================================
  // SQL SERVER DUPLICATE KEY HANDLING
  // ==========================================

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const dbError = error as {
      number?: number;
      driverError?: {
        number?: number;
        message?: string;
      };
      message?: string;
    };

    const errorNumber =
      dbError.driverError?.number ?? dbError.number;

    return (
      errorNumber === 2601 ||
      errorNumber === 2627 ||
      /duplicate key|unique constraint/i.test(
        dbError.driverError?.message ??
          dbError.message ??
          '',
      )
    );
  }
}
