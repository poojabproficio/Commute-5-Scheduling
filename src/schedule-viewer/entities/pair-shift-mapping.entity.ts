
import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Campus } from '../../campus/entities/campus.entity.js';
import { Shift } from '../../Shift/entities/shift.entity.js';

@Entity('pair_shift_mapping')
@Index(
  'UQ_pair_shift_mapping_campus_login_shift',
  ['campus', 'shift'],
  {
    unique: true,
    where: 'deleted_at IS NULL',
  },
)
export class PairShiftMapping extends BaseAuditEntity {
  @ManyToOne(() => Campus, { nullable: false })
  @JoinColumn({ name: 'campus_id' })
  campus!: Campus;

  // Campus-wide LOGIN shift
  @ManyToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'shift_id' })
  shift!: Shift;

  // Corresponding campus-wide LOGOUT shift
  @ManyToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'paired_shift_id' })
  pairedShift!: Shift;
}
