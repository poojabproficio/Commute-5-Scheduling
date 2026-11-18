
import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Employee } from '../../Employee/entities/employee.entity.js';
import { Shift } from '../../Shift/entities/shift.entity.js';

@Entity('pair_shift_mapping')
@Index(
  'UQ_pair_shift_mapping_employee_login_shift',
  ['employee', 'shift'],
  {
    unique: true,
    where: 'deleted_at IS NULL',
  },
)
export class PairShiftMapping extends BaseAuditEntity {
  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  // The employee's LOGIN shift
  @ManyToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'shift_id' })
  shift!: Shift;

  // The corresponding LOGOUT shift
  @ManyToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'paired_shift_id' })
  pairedShift!: Shift;
}
