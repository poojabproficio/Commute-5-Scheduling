
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Allowed holiday classifications
const HOLIDAY_TYPES = [
  'NATIONAL',
  'REGIONAL',
  'COMPANY',
  'OPTIONAL',
] as const;

// ==========================================
// CREATE HOLIDAY DTO
// ==========================================

export class CreateHolidayDto {

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Start date must be in YYYY-MM-DD format',
  })
  startDate!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in YYYY-MM-DD format',
  })
  endDate!: string;

  @IsIn(HOLIDAY_TYPES, {
    message: 'Holiday type must be NATIONAL, REGIONAL, COMPANY or OPTIONAL',
  })
  holidayType!: typeof HOLIDAY_TYPES[number];

  @IsBoolean()
  isRecurring!: boolean;

  @IsOptional()
  @IsBoolean()
  blockScheduling?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

// ==========================================
// UPDATE HOLIDAY DTO
// ==========================================

export class UpdateHolidayDto {

  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Start date must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in YYYY-MM-DD format',
  })
  endDate?: string;

  @IsOptional()
  @IsIn(HOLIDAY_TYPES, {
    message: 'Holiday type must be NATIONAL, REGIONAL, COMPANY or OPTIONAL',
  })
  holidayType?: typeof HOLIDAY_TYPES[number];

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  blockScheduling?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
