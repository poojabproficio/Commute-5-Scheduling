
import { Entity, Column } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

@Entity('Campus')
export class Campus extends BaseAuditEntity {
  @Column({
    length: 100,
  })
  name!: string;
}
