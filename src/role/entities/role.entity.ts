
import { Entity, Column } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

@Entity('Role')
export class Role extends BaseAuditEntity {

  @Column({ name: 'RoleCode', type: 'varchar', length: 30 })
  roleCode!: string;

  @Column({ name: 'RoleName', type: 'varchar', length: 100 })
  roleName!: string;

}
