import { Type } from 'class-transformer';
import {
  IsInt,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateEmployeeScheduleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  employeeId?: number;

  @IsOptional()
  @IsDateString()
  loginDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loginShiftId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logoutShiftId?: number | null;
}