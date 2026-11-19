
import { Type } from 'class-transformer';
import {
  IsInt,
  Min,
} from 'class-validator';

export class CreateShiftPairDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  employeeId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  shiftId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pairedShiftId!: number;
}
