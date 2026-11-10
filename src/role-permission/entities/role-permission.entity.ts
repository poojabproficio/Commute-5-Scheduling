
import { Entity, Column } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

@Entity('RolePermission')
export class RolePermission extends BaseAuditEntity {

  @Column({ name: 'RoleId', type: 'int' })
  roleId!: number;

  @Column({ name: 'PermissionId', type: 'int' })
  permissionId!: number;

}
