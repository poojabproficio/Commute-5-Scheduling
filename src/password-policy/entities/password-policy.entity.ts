
import { Entity, Column } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

@Entity('PasswordPolicy')
export class PasswordPolicy extends BaseAuditEntity {

  @Column({ name: 'CampusId', type: 'int' })
  campusId!: number;

  @Column({
    name: 'PasswordExpiryDays',
    type: 'int',
  })
  passwordExpiryDays!: number;

}
