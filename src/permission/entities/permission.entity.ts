
import { Entity, Column } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

@Entity('Permission')
export class Permission extends BaseAuditEntity {

  @Column({ name: 'Module', type: 'varchar', length: 50 })
  module!: string;

  @Column({ name: 'Action', type: 'varchar', length: 30 })
  action!: string;

  @Column({
    name: 'Description',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  description!: string | null;

}
