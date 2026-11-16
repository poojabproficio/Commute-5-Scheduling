
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';


import { Campus } from '../campus/entities/campus.entity.js';

import { Holiday } from './entities/holiday.entity/holiday.entity.js';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto/holiday.dto.js';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,

    @InjectRepository(Campus)
    private readonly campusRepository: Repository<Campus>,
  ) {}

  // ==========================================
  // GET AUTHENTICATED USER DETAILS
  // ==========================================

  private getUserDetails(user: any) {
    if (!Number.isInteger(user?.campusId)) {
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
  // VALIDATE YEAR
  // ==========================================

  private validateYear(year: number): void {
    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 9999
    ) {
      throw new BadRequestException(
        'A valid year is required',
      );
    }
  }

  // ==========================================
  // VALIDATE DATE
  // ==========================================

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }

  // ==========================================
  // VALIDATE HOLIDAY DATES
  // ==========================================

  private validateHolidayDates(
    startDate: string,
    endDate: string,
  ): void {
    if (!this.isValidDate(startDate)) {
      throw new BadRequestException(
        'Start date must be a valid date in YYYY-MM-DD format',
      );
    }

    if (!this.isValidDate(endDate)) {
      throw new BadRequestException(
        'End date must be a valid date in YYYY-MM-DD format',
      );
    }

    if (endDate < startDate) {
      throw new BadRequestException(
        'End date cannot be earlier than start date',
      );
    }
  }

  // ==========================================
  // GET CAMPUS HOLIDAYS
  // ==========================================

  async findAll(
    user: any,
    year?: string,
  ): Promise<Holiday[]> {
    const { campusId } = this.getUserDetails(user);

    const query = this.holidayRepository
      .createQueryBuilder('holiday')
      .where('holiday.campusId = :campusId', { campusId })
      .andWhere('holiday.deleted_at IS NULL');

    if (year !== undefined) {
      const selectedYear = Number(year);

      this.validateYear(selectedYear);

      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      // Include holidays that overlap the selected year.
      query
        .andWhere('holiday.startDate <= :yearEnd', { yearEnd })
        .andWhere('holiday.endDate >= :yearStart', { yearStart });
    }

    return query
      .orderBy('holiday.startDate', 'ASC')
      .addOrderBy('holiday.name', 'ASC')
      .getMany();
  }

  // ==========================================
  // CREATE HOLIDAY
  // ==========================================

  async create(
    dto: CreateHolidayDto,
    user: any,
  ): Promise<Holiday> {
    const { campusId, username } =
      this.getUserDetails(user);

    // 1. Validate dates.
    this.validateHolidayDates(
      dto.startDate,
      dto.endDate,
    );

    // 2. Verify authenticated user's campus.
    const campus = await this.campusRepository.findOne({
      where: {
        id: campusId,
        deleted_at: IsNull(),
      },
    });

    if (!campus) {
      throw new NotFoundException('Campus not found');
    }

    // 3. Create holiday using authenticated campus.
    const holiday = this.holidayRepository.create({
      ...dto,
      campusId,
      blockScheduling: dto.blockScheduling ?? true,
      notes: dto.notes ?? null,
      created_by: username,
      updated_by: username,
    });

    // 4. Save.
    return this.holidayRepository.save(holiday);
  }

  // ==========================================
  // GET HOLIDAY CALENDAR
  // ==========================================

  async getCalendar(
    user: any,
    year?: string,
  ) {
    const selectedYear =
      year === undefined ? new Date().getFullYear() : Number(year);

    this.validateYear(selectedYear);

    const holidays = await this.findAll(
      user,
      String(selectedYear),
    );

    return {
      year: selectedYear,
      holidays,
    };
  }

  // ==========================================
  // GET HOLIDAY KPIs
  // ==========================================

  async getKpis(
    user: any,
    year?: string,
  ) {
    const selectedYear =
      year === undefined ? new Date().getFullYear() : Number(year);

    this.validateYear(selectedYear);

    const holidays = await this.findAll(
      user,
      String(selectedYear),
    );

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const upcomingHolidays = holidays.filter(
      (holiday) => holiday.endDate >= today,
    );

    const nextHoliday = upcomingHolidays
      .slice()
      .sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      )[0] ?? null;

    return {
      year: selectedYear,
      totalHolidays: holidays.length,
      upcomingHolidays: upcomingHolidays.length,
      nextHoliday,
    };
  }

  // ==========================================
  // FIND HOLIDAY FOR AUTHENTICATED CAMPUS
  // ==========================================

  private async findHolidayForCampus(
    id: number,
    campusId: number,
  ): Promise<Holiday> {
    const holiday = await this.holidayRepository.findOne({
      where: {
        id,
        campusId,
        deleted_at: IsNull(),
      },
    });

    if (!holiday) {
      throw new NotFoundException(
        'Holiday not found for this campus',
      );
    }

    return holiday;
  }

  // ==========================================
  // UPDATE HOLIDAY
  // ==========================================

  async update(
    id: number,
    dto: UpdateHolidayDto,
    user: any,
  ): Promise<Holiday> {
    const { campusId, username } =
      this.getUserDetails(user);

    // 1. Find holiday within authenticated campus.
    const holiday = await this.findHolidayForCampus(
      id,
      campusId,
    );

    // 2. Merge old and new values.
    const updatedStartDate =
      dto.startDate ?? holiday.startDate;

    const updatedEndDate =
      dto.endDate ?? holiday.endDate;

    // 3. Validate final dates.
    this.validateHolidayDates(
      updatedStartDate,
      updatedEndDate,
    );

    // 4. Apply updates.
    Object.assign(holiday, dto);

    // 5. Update audit information.
    holiday.updated_by = username;

    // 6. Save.
    return this.holidayRepository.save(holiday);
  }

  // ==========================================
  // SOFT DELETE HOLIDAY
  // ==========================================

  async remove(
    id: number,
    user: any,
  ) {
    const { campusId, username } =
      this.getUserDetails(user);

    // 1. Find holiday within authenticated campus.
    const holiday = await this.findHolidayForCampus(
      id,
      campusId,
    );

    // 2. Set audit information.
    holiday.updated_by = username;
    holiday.deleted_at = new Date();

    // 3. Save as soft-deleted.
    await this.holidayRepository.save(holiday);

    return {
      message: 'Holiday deleted successfully',
      id,
    };
  }

  // ==========================================
  // CHANGE YEAR OF A DATE
  // ==========================================

  private changeDateYear(
    dateValue: string,
    targetYear: number,
  ): string {
    const [, month, day] = dateValue
      .split('-')
      .map(Number);

    // Handle February 29 when copying to a non-leap year.
    const lastDayOfMonth = new Date(
      Date.UTC(targetYear, month, 0),
    ).getUTCDate();

    const adjustedDay = Math.min(day, lastDayOfMonth);

    return [
      targetYear,
      String(month).padStart(2, '0'),
      String(adjustedDay).padStart(2, '0'),
    ].join('-');
  }

  // ==========================================
  // COPY HOLIDAYS FROM LAST YEAR
  // ==========================================

  async copyFromLastYear(
    targetYear: number,
    user: any,
  ) {
    const { campusId, username } =
      this.getUserDetails(user);

    // 1. Validate target year.
    this.validateYear(targetYear);

    const sourceYear = targetYear - 1;

    // 2. Fetch source-year holidays for this campus.
    const sourceHolidays = await this.findAll(
      user,
      String(sourceYear),
    );

    if (sourceHolidays.length === 0) {
      throw new NotFoundException(
        `No holidays found for ${sourceYear}`,
      );
    }

    // 3. Fetch existing target-year holidays.
    const existingTargetHolidays = await this.findAll(
      user,
      String(targetYear),
    );

    // 4. Prepare copies, skipping matching existing records.
    const holidaysToCreate: Holiday[] = [];
    let skipped = 0;

    for (const source of sourceHolidays) {
      const startDate = this.changeDateYear(
        source.startDate,
        targetYear,
      );

      const endDate = this.changeDateYear(
        source.endDate,
        targetYear,
      );

      const alreadyExists = existingTargetHolidays.some(
        (existing) =>
          existing.name.trim().toLowerCase() ===
            source.name.trim().toLowerCase() &&
          existing.startDate === startDate &&
          existing.endDate === endDate,
      );

      if (alreadyExists) {
        skipped++;
        continue;
      }

      const copy = this.holidayRepository.create({
        campusId,
        name: source.name,
        startDate,
        endDate,
        holidayType: source.holidayType,
        isRecurring: source.isRecurring,
        blockScheduling: source.blockScheduling,
        notes: source.notes,
        created_by: username,
        updated_by: username,
      });

      holidaysToCreate.push(copy);
    }

    // 5. Save copied records.
    if (holidaysToCreate.length > 0) {
      await this.holidayRepository.save(holidaysToCreate);
    }

    return {
      message: 'Holiday copy operation completed',
      sourceYear,
      targetYear,
      copied: holidaysToCreate.length,
      skipped,
    };
  }
}
