
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  Between,
  IsNull,
} from 'typeorm';

import { Employee } from '../Employee/entities/employee.entity.js';

import {
  Shift,
  ShiftDirection,
} from '../Shift/entities/shift.entity.js';

import { Schedule } from '../scheduling/entities/scheduling.entity.js';

import { Holiday } from '../holiday/entities/holiday.entity/holiday.entity.js';

import { CreateShiftPairDto } from './dto/create-shift-pair.dto.js';
import { UpdateShiftPairDto } from './dto/update-shift-pair.dto.js';

import {
  EmployeeSchedule,
  ScheduleStatus,
  ScheduleSource,
} from './entities/employee-schedule.entity.js';

import { PairShiftMapping } from './entities/pair-shift-mapping.entity.js';
import { CreateEmployeeScheduleDto } from './dto/create-employee-schedule.dto.js';
import { UpdateEmployeeScheduleDto } from './dto/update-employee-schedule.dto.js';

@Injectable()
export class ScheduleViewerService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,

    @InjectRepository(EmployeeSchedule)
    private readonly employeeScheduleRepository: Repository<EmployeeSchedule>,

    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    @InjectRepository(PairShiftMapping)
    private readonly pairShiftMappingRepository: Repository<PairShiftMapping>,

    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
  ) {}

  // ==========================================
  // SCHEDULE VIEWER
  // ==========================================

  async getViewerData(
    user: { campusId: number },
    startDate: string,
    endDate: string,
  ) {
    const campusId = user.campusId;

    const employees = await this.employeeRepository.find({
      where: {
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
      order: {
        employeeName: 'ASC',
      },
    });

    const shifts = await this.shiftRepository.find({
      where: {
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
      order: {
        cabTime: 'ASC',
      },
    });

    const schedules = await this.employeeScheduleRepository.find({
      where: {
        employee: {
          campus: { id: campusId },
        },
        loginDate: Between(startDate, endDate),
        deleted_at: IsNull(),
      },
      relations: {
        employee: true,
        loginShift: true,
        logoutShift: true,
        loginUpdatedBy: true,
        logoutUpdatedBy: true,
      },
      order: {
        loginDate: 'ASC',
      },
    });

    const policy = await this.scheduleRepository.findOne({
      where: {
        campusId,
        deleted_at: IsNull(),
      },
    });

    if (!policy) {
      throw new NotFoundException(
        'Scheduling policy not found for this campus.',
      );
    }

    const holidays = await this.holidayRepository.find({
      where: {
        campus: { id: campusId },
        date: Between(startDate, endDate),
        deleted_at: IsNull(),
      },
      order: {
        date: 'ASC',
      },
    });

    return {
      campusId,
      dateRange: {
        startDate,
        endDate,
      },
      employees,
      shifts,
      schedules,
      policy,
      holidays,
    };
  }

  // ==========================================
  // EMPLOYEE SHIFT OPTIONS
  // ==========================================

  async getEmployeeShiftOptions(
    user: { campusId: number },
    employeeId: number,
    loginShiftId?: number,
  ) {
    const campusId = user.campusId;

    // 1. Validate employee belongs to this campus.
    const employee = await this.employeeRepository.findOne({
      where: {
        id: employeeId,
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
    });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found in the selected campus.',
      );
    }

    // 2. Get campus scheduling policy.
    const policy = await this.scheduleRepository.findOne({
      where: {
        campusId,
        deleted_at: IsNull(),
      },
    });

    if (!policy) {
      throw new NotFoundException(
        'Scheduling policy not found for this campus.',
      );
    }

    // 3. Fetch ALL active LOGIN and LOGOUT shifts
    // directly from the SHIFT table for this campus.

    const [loginShifts, logoutShifts] = await Promise.all([
      this.shiftRepository.find({
        where: {
          campus: { id: campusId },
          shiftDirection: ShiftDirection.LOGIN,
          deleted_at: IsNull(),
        },
        order: {
          cabTime: 'ASC',
        },
      }),

      this.shiftRepository.find({
        where: {
          campus: { id: campusId },
          shiftDirection: ShiftDirection.LOGOUT,
          deleted_at: IsNull(),
        },
        order: {
          cabTime: 'ASC',
        },
      }),
    ]);

    // 4. Validate optional selected LOGIN shift.
    if (loginShiftId !== undefined) {
      const selectedLoginShift = loginShifts.find(
        (shift) => shift.id === loginShiftId,
      );

      if (!selectedLoginShift) {
        throw new NotFoundException(
          'Selected login shift not found in the selected campus.',
        );
      }
    }

    // ==========================================
    // INTERLOCK ON
    // Return ALL active campus LOGIN and LOGOUT shifts.
    // Do not use pair_shift_mapping.
    // ==========================================

    if (policy.interlockLoginLogout) {
      return {
        interlockLoginLogout: true,
        loginShifts,
        logoutShifts,
      };
    }

    // ==========================================
    // INTERLOCK OFF
    // Return all active campus shifts and employee
    // mappings for frontend auto-selection.
    // ==========================================

    const mappings = await this.pairShiftMappingRepository.find({
      where: {
        employee: {
          id: employeeId,
        },
        deleted_at: IsNull(),
      },
      relations: {
        shift: true,
        pairedShift: true,
      },
    });

    const activeLoginIds = new Set(
      loginShifts.map((shift) => shift.id),
    );

    const activeLogoutIds = new Set(
      logoutShifts.map((shift) => shift.id),
    );

    const shiftPairs = mappings
      .filter(
        (mapping) =>
          activeLoginIds.has(mapping.shift.id) &&
          activeLogoutIds.has(mapping.pairedShift.id) &&
          mapping.shift.shiftDirection === ShiftDirection.LOGIN &&
          mapping.pairedShift.shiftDirection === ShiftDirection.LOGOUT,
      )
      .map((mapping) => ({
        loginShiftId: mapping.shift.id,
        logoutShiftId: mapping.pairedShift.id,
      }));

    return {
      interlockLoginLogout: false,
      loginShifts,
      logoutShifts,
      shiftPairs,
    };
  }

  // ==========================================
  // SHIFT PAIR MAPPING
  // ==========================================

  async getShiftPairs(user: { campusId: number }) {
    return this.pairShiftMappingRepository.find({
      where: {
        employee: {
          campus: { id: user.campusId },
        },
        deleted_at: IsNull(),
      },
      relations: {
        employee: true,
        shift: true,
        pairedShift: true,
      },
      order: {
        employee: {
          employeeName: 'ASC',
        },
      },
    });
  }

  async createShiftPair(
    user: { sub: number; campusId: number },
    dto: CreateShiftPairDto,
  ) {
    const campusId = user.campusId;

    const employee = await this.employeeRepository.findOne({
      where: {
        id: dto.employeeId,
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
    });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found in the selected campus.',
      );
    }

    const loginShift = await this.shiftRepository.findOne({
      where: {
        id: dto.shiftId,
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
    });

    if (!loginShift) {
      throw new NotFoundException(
        'Login shift not found in the selected campus.',
      );
    }

    const logoutShift = await this.shiftRepository.findOne({
      where: {
        id: dto.pairedShiftId,
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
    });

    if (!logoutShift) {
      throw new NotFoundException(
        'Logout shift not found in the selected campus.',
      );
    }

    if (loginShift.shiftDirection !== ShiftDirection.LOGIN) {
      throw new BadRequestException(
        'The selected shift must be a LOGIN shift.',
      );
    }

    if (logoutShift.shiftDirection !== ShiftDirection.LOGOUT) {
      throw new BadRequestException(
        'The paired shift must be a LOGOUT shift.',
      );
    }

    const existingMapping =
      await this.pairShiftMappingRepository.findOne({
        where: {
          employee: { id: employee.id },
          shift: { id: loginShift.id },
          deleted_at: IsNull(),
        },
      });

    if (existingMapping) {
      throw new ConflictException(
        'A shift pairing already exists for this employee and login shift.',
      );
    }

    const mapping = this.pairShiftMappingRepository.create({
      employee,
      shift: loginShift,
      pairedShift: logoutShift,
      created_by: String(user.sub),
    });

    const savedMapping =
      await this.pairShiftMappingRepository.save(mapping);

    return this.pairShiftMappingRepository.findOne({
      where: {
        id: savedMapping.id,
      },
      relations: {
        employee: true,
        shift: true,
        pairedShift: true,
      },
    });
  }

  async updateShiftPair(
    user: { sub: number; campusId: number },
    mappingId: number,
    dto: UpdateShiftPairDto,
  ) {
    const campusId = user.campusId;

    const mapping = await this.pairShiftMappingRepository.findOne({
      where: {
        id: mappingId,
        employee: {
          campus: { id: campusId },
        },
        deleted_at: IsNull(),
      },
      relations: {
        employee: true,
        shift: true,
        pairedShift: true,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        'Shift pairing not found in the selected campus.',
      );
    }

    const logoutShift = await this.shiftRepository.findOne({
      where: {
        id: dto.pairedShiftId,
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
    });

    if (!logoutShift) {
      throw new NotFoundException(
        'Logout shift not found in the selected campus.',
      );
    }

    if (logoutShift.shiftDirection !== ShiftDirection.LOGOUT) {
      throw new BadRequestException(
        'The paired shift must be a LOGOUT shift.',
      );
    }

    mapping.pairedShift = logoutShift;
    mapping.updated_by = String(user.sub);

    await this.pairShiftMappingRepository.save(mapping);

    return this.pairShiftMappingRepository.findOne({
      where: {
        id: mapping.id,
      },
      relations: {
        employee: true,
        shift: true,
        pairedShift: true,
      },
    });
  }

  async deleteShiftPair(
    user: { sub: number; campusId: number },
    mappingId: number,
  ) {
    const mapping = await this.pairShiftMappingRepository.findOne({
      where: {
        id: mappingId,
        employee: {
          campus: { id: user.campusId },
        },
        deleted_at: IsNull(),
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        'Shift pairing not found in the selected campus.',
      );
    }

    mapping.deleted_at = new Date();
    mapping.updated_by = String(user.sub);

    await this.pairShiftMappingRepository.save(mapping);

    return {
      message: 'Shift pairing deleted successfully.',
      id: mapping.id,
    };
  }

  // ==========================================
  // DUTY DATE CALCULATION
  // ==========================================

  private getLogoutDate(
    loginDate: string,
    loginShift: Shift | null,
    logoutShift: Shift | null,
  ): string | null {
    if (!logoutShift) {
      return null;
    }

    if (!loginShift) {
      return loginDate;
    }

    const loginTime = loginShift.cabTime;
    const logoutTime = logoutShift.cabTime;

    const toMinutes = (time: string): number => {
      if (!/^\d{2}:\d{2}$/.test(time)) {
        throw new BadRequestException(
          'Invalid shift cab time.',
        );
      }

      const [hours, minutes] = time.split(':').map(Number);

      if (hours > 23 || minutes > 59) {
        throw new BadRequestException(
          'Invalid shift cab time.',
        );
      }

      return hours * 60 + minutes;
    };

    const loginMinutes = toMinutes(loginTime);
    const logoutMinutes = toMinutes(logoutTime);

    if (loginMinutes === logoutMinutes) {
      throw new BadRequestException(
        'Login and logout shifts cannot have the same cab time.',
      );
    }

    if (logoutMinutes < loginMinutes) {
      const date = new Date(`${loginDate}T00:00:00.000Z`);

      date.setUTCDate(date.getUTCDate() + 1);

      return date.toISOString().slice(0, 10);
    }

    return loginDate;
  }

  // ==========================================
  // DUTY SHIFT VALIDATION
  // ==========================================

  private async validateDutyShifts(
    _employeeId: number,
    campusId: number,
    loginShiftId: number | null,
    logoutShiftId: number | null,
  ) {
    if (!loginShiftId && !logoutShiftId) {
      throw new BadRequestException(
        'At least one login or logout shift is required.',
      );
    }

    let loginShift: Shift | null = null;
    let logoutShift: Shift | null = null;

    // Validate LOGIN shift directly against SHIFT table.
    if (loginShiftId) {
      loginShift = await this.shiftRepository.findOne({
        where: {
          id: loginShiftId,
          campus: { id: campusId },
          deleted_at: IsNull(),
        },
      });

      if (!loginShift) {
        throw new NotFoundException(
          'Login shift not found in the selected campus.',
        );
      }

      if (loginShift.shiftDirection !== ShiftDirection.LOGIN) {
        throw new BadRequestException(
          'Selected shift must be a LOGIN shift.',
        );
      }
    }

    // Validate LOGOUT shift directly against SHIFT table.
    if (logoutShiftId) {
      logoutShift = await this.shiftRepository.findOne({
        where: {
          id: logoutShiftId,
          campus: { id: campusId },
          deleted_at: IsNull(),
        },
      });

      if (!logoutShift) {
        throw new NotFoundException(
          'Logout shift not found in the selected campus.',
        );
      }

      if (logoutShift.shiftDirection !== ShiftDirection.LOGOUT) {
        throw new BadRequestException(
          'Selected shift must be a LOGOUT shift.',
        );
      }
    }

    // Get campus scheduling policy.
    const policy = await this.scheduleRepository.findOne({
      where: {
        campusId,
        deleted_at: IsNull(),
      },
    });

    if (!policy) {
      throw new NotFoundException(
        'Scheduling policy not found for this campus.',
      );
    }

    // ==========================================
    // INTERLOCK ON
    // Any active campus LOGIN + LOGOUT combination
    // is allowed.
    //
    // No employee-specific pair mapping check.
    // No pair_shift_mapping query.
    // ==========================================

    if (policy.interlockLoginLogout) {
      return {
        loginShift,
        logoutShift,
      };
    }

    // ==========================================
    // INTERLOCK OFF
    // Any valid active campus LOGIN and LOGOUT
    // shifts are allowed for saving.
    //
    // pair_shift_mapping is used by the options API
    // for frontend auto-selection, not save validation.
    // ==========================================

    return {
      loginShift,
      logoutShift,
    };
  }

  // ==========================================
  // CREATE DUTY
  // ==========================================

  async createDuty(
    user: { sub: number; campusId: number },
    dto: CreateEmployeeScheduleDto,
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.loginDate)) {
      throw new BadRequestException(
        'loginDate must be in YYYY-MM-DD format.',
      );
    }

    const employee = await this.employeeRepository.findOne({
      where: {
        id: dto.employeeId,
        campus: { id: user.campusId },
        deleted_at: IsNull(),
      },
    });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found in the selected campus.',
      );
    }

    const existing = await this.employeeScheduleRepository.findOne({
      where: {
        employee: { id: employee.id },
        loginDate: dto.loginDate,
        deleted_at: IsNull(),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A duty already exists for this employee and date.',
      );
    }

    const { loginShift, logoutShift } =
      await this.validateDutyShifts(
        employee.id,
        user.campusId,
        dto.loginShiftId ?? null,
        dto.logoutShiftId ?? null,
      );

    const now = new Date();

    const duty = this.employeeScheduleRepository.create({
      employee,
      loginDate: dto.loginDate,
      loginShift,
      logoutShift,

      logoutDate: this.getLogoutDate(
        dto.loginDate,
        loginShift,
        logoutShift,
      ),

      loginStatus: loginShift
        ? ScheduleStatus.SCHEDULED
        : null,

      logoutStatus: logoutShift
        ? ScheduleStatus.SCHEDULED
        : null,

      loginSource: loginShift
        ? ScheduleSource.MANAGER
        : null,

      logoutSource: logoutShift
        ? ScheduleSource.MANAGER
        : null,

      loginUpdatedAt: loginShift ? now : null,
      logoutUpdatedAt: logoutShift ? now : null,

      created_by: String(user.sub),
    });

    const saved = await this.employeeScheduleRepository.save(duty);

    return this.employeeScheduleRepository.findOne({
      where: {
        id: saved.id,
      },
      relations: {
        employee: true,
        loginShift: true,
        logoutShift: true,
      },
    });
  }

  // ==========================================
  // DELETE DUTY (SOFT DELETE)
  // ==========================================

  async deleteDuty(
    user: { sub: number; campusId: number },
    dutyId: number,
  ) {
    const duty = await this.employeeScheduleRepository.findOne({
      where: {
        id: dutyId,
        employee: {
          campus: { id: user.campusId },
        },
        deleted_at: IsNull(),
      },
      relations: {
        employee: true,
      },
    });

    if (!duty) {
      throw new NotFoundException(
        'Duty not found in the selected campus.',
      );
    }

    if (
      duty.loginStatus === ScheduleStatus.CANCELLED &&
      duty.logoutStatus === ScheduleStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cancelled duty cannot be deleted.',
      );
    }

    duty.deleted_at = new Date();
    duty.updated_by = String(user.sub);

    await this.employeeScheduleRepository.save(duty);

    return {
      message: 'Duty deleted successfully.',
      id: duty.id,
    };
  }

  // ==========================================
  // UPDATE DUTY
  // ==========================================

  async updateDuty(
    user: { sub: number; campusId: number },
    dutyId: number,
    dto: UpdateEmployeeScheduleDto,
  ) {
    const duty = await this.employeeScheduleRepository.findOne({
      where: {
        id: dutyId,
        employee: {
          campus: { id: user.campusId },
        },
        deleted_at: IsNull(),
      },
      relations: {
        employee: true,
        loginShift: true,
        logoutShift: true,
      },
    });

    if (!duty) {
      throw new NotFoundException(
        'Duty not found in the selected campus.',
      );
    }

    if (
      duty.loginStatus === ScheduleStatus.CANCELLED &&
      duty.logoutStatus === ScheduleStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cancelled duty cannot be updated.',
      );
    }

    if (
      dto.loginDate !== undefined &&
      !/^\d{4}-\d{2}-\d{2}$/.test(dto.loginDate)
    ) {
      throw new BadRequestException(
        'loginDate must be in YYYY-MM-DD format.',
      );
    }

    const employeeId = dto.employeeId ?? duty.employee.id;

    const employee = await this.employeeRepository.findOne({
      where: {
        id: employeeId,
        campus: { id: user.campusId },
        deleted_at: IsNull(),
      },
    });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found in the selected campus.',
      );
    }

    const loginDate = dto.loginDate ?? duty.loginDate;

    const duplicate = await this.employeeScheduleRepository.findOne({
      where: {
        employee: { id: employeeId },
        loginDate,
        deleted_at: IsNull(),
      },
    });

    if (duplicate && duplicate.id !== duty.id) {
      throw new ConflictException(
        'A duty already exists for this employee and date.',
      );
    }

    const loginShiftId =
      dto.loginShiftId !== undefined
        ? dto.loginShiftId
        : duty.loginShift?.id ?? null;

    const logoutShiftId =
      dto.logoutShiftId !== undefined
        ? dto.logoutShiftId
        : duty.logoutShift?.id ?? null;

    const { loginShift, logoutShift } =
      await this.validateDutyShifts(
        employeeId,
        user.campusId,
        loginShiftId ?? null,
        logoutShiftId ?? null,
      );

    const now = new Date();

    duty.employee = employee;
    duty.loginDate = loginDate;
    duty.loginShift = loginShift;
    duty.logoutShift = logoutShift;

    duty.logoutDate = this.getLogoutDate(
      loginDate,
      loginShift,
      logoutShift,
    );

    if (
      dto.loginShiftId !== undefined ||
      dto.loginDate !== undefined
    ) {
      duty.loginStatus = loginShift
        ? ScheduleStatus.SCHEDULED
        : null;

      duty.loginSource = loginShift
        ? ScheduleSource.MANAGER
        : null;

      duty.loginUpdatedAt = loginShift ? now : null;
      duty.loginOverrideReason = null;
    }

    if (
      dto.logoutShiftId !== undefined ||
      dto.loginDate !== undefined
    ) {
      duty.logoutStatus = logoutShift
        ? ScheduleStatus.SCHEDULED
        : null;

      duty.logoutSource = logoutShift
        ? ScheduleSource.MANAGER
        : null;

      duty.logoutUpdatedAt = logoutShift ? now : null;
      duty.logoutOverrideReason = null;
    }

    duty.updated_by = String(user.sub);

    await this.employeeScheduleRepository.save(duty);

    return this.employeeScheduleRepository.findOne({
      where: {
        id: duty.id,
      },
      relations: {
        employee: true,
        loginShift: true,
        logoutShift: true,
      },
    });
  }
}
