
import { Entity, Column } from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';

@Entity('UserCampus')
export class UserCampus extends BaseAuditEntity {

  @Column({ name: 'UserId', type: 'int' })
  userId!: number;

  @Column({ name: 'CampusId', type: 'int' })
  campusId!: number;

  @Column({ name: 'RoleId', type: 'int' })
  roleId!: number;

}
