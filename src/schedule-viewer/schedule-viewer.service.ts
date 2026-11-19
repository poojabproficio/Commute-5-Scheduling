import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import { Employee } from '../Employee/entities/employee.entity.js';
import {
  Shift,
  ShiftDirection,
} from '../Shift/entities/shift.entity.js';
import { Schedule } from '../scheduling/entities/scheduling.entity.js';
import { Holiday } from '../holiday/entities/holiday.entity/holiday.entity.js';
import { CreateShiftPairDto } from './dto/create-shift-pair.dto.js';
import { EmployeeSchedule } from './entities/employee-schedule.entity.js';
import { PairShiftMapping } from './entities/pair-shift-mapping.entity.js';
import { UpdateShiftPairDto } from './dto/update-shift-pair.dto.js';

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

async createShiftPair(
  user: { sub: number; campusId: number },
  dto: CreateShiftPairDto,
) {
  const campusId = user.campusId;

  // 1. Find the employee in the authenticated user's campus.
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

  // 2. Find the LOGIN shift in the same campus.
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

  // 3. Find the LOGOUT shift in the same campus.
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

  // 4. Validate shift directions.
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

  // 5. Check whether an active pairing already exists.
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

  // 6. Create and save the mapping.
  const mapping = this.pairShiftMappingRepository.create({
    employee,
    shift: loginShift,
    pairedShift: logoutShift,
    created_by: String(user.sub),
  });

  const savedMapping =
    await this.pairShiftMappingRepository.save(mapping);

  // 7. Return the saved mapping with related details.
  return this.pairShiftMappingRepository.findOne({
    where: { id: savedMapping.id },
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

  // Find the existing active mapping for this campus.
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

  // Find the new LOGOUT shift.
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

  // Update only the paired logout shift.
  mapping.pairedShift = logoutShift;
  mapping.updated_by = String(user.sub);

  await this.pairShiftMappingRepository.save(mapping);

  return this.pairShiftMappingRepository.findOne({
    where: { id: mapping.id },
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

}


