
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseAuditEntity } from '../../common/entities/base.audit.entity.js';
import { Campus } from '../../campus/entities/campus.entity.js';

@Entity('User')
export class User extends BaseAuditEntity {

  @Column({ name: 'Username', type: 'varchar', length: 30 })
  username!: string;

  @Column({ name: 'Email', type: 'varchar', length: 100 })
  email!: string;

  @Column({ name: 'Password', type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'PasswordChangedAt', type: 'datetime2' })
  passwordChangedAt!: Date;

  @Column({ name: 'TokenVersion', type: 'int' })
  tokenVersion!: number;

  @Column({ name: 'IsActive', type: 'bit' })
  isActive!: boolean;

  @ManyToOne(() => Campus, { nullable: false })
  @JoinColumn({ name: 'CampusId' })
  campus!: Campus;

  
@Column({ default: true })
mustChangePassword!: boolean;

@Column({ name: 'FailedLoginAttempts', type: 'int', default: 0 })
failedLoginAttempts!: number;

@Column({ name: 'LockedAt', type: 'datetime2', nullable: true })
lockedAt!: Date | null;

}
