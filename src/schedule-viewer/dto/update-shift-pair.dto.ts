
import { Type } from 'class-transformer';
import {
  IsInt,
  Min,
} from 'class-validator';

export class UpdateShiftPairDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pairedShiftId!: number;
}
