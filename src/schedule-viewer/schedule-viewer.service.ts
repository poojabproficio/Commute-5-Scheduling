
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import { Employee } from '../Employee/entities/employee.entity.js';
import { Shift } from '../Shift/entities/shift.entity.js';
import { Schedule } from '../scheduling/entities/scheduling.entity.js';
import { Holiday } from '../holiday/entities/holiday.entity/holiday.entity.js';

import { EmployeeSchedule } from './entities/employee-schedule.entity.js';
import { PairShiftMapping } from './entities/pair-shift-mapping.entity.js';

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

  async getViewerData(
    user: { campusId: number },
    startDate: string,
    endDate: string,
  ) {
    const campusId = user.campusId;

    // 1. Get active employees belonging to the logged-in campus.
    const employees = await this.employeeRepository.find({
      where: {
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
      order: {
        employeeName: 'ASC',
      },
    });

    // 2. Get shifts belonging to the logged-in campus.
    const shifts = await this.shiftRepository.find({
      where: {
        campus: { id: campusId },
        deleted_at: IsNull(),
      },
      order: {
        cabTime: 'ASC',
      },
    });

    // 3. Get schedules for the selected date range.
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

    // 4. Get campus scheduling policy.
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

    // 5. Get campus holidays for the selected date range.
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

  // Retrieve active employee login/logout shift pairings.
  async getShiftPairs(user: { campusId: number }) {
    const campusId = user.campusId;

    const mappings = await this.pairShiftMappingRepository.find({
      where: {
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
      order: {
        employee: {
          employeeName: 'ASC',
        },
      },
    });

    return mappings;
  }
}


