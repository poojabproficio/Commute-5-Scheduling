
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';

import { ScheduleController } from './scheduling.controller.js';
import { ScheduleService } from './scheduling.service.js';
import { Schedule } from './entities/scheduling.entity.js';

import { Campus } from '../campus/entities/campus.entity.js';

import { PermissionsGuard } from '../common/guards/permission.guard.js';
import { RolePermission } from '../role-permission/entities/role-permission.entity.js';
import { Permission } from '../permission/entities/permission.entity.js';

@Module({
  imports: [
    AuthModule,

    TypeOrmModule.forFeature([
      Schedule,
      Campus,
      RolePermission,
      Permission,
    ]),
  ],

  controllers: [ScheduleController],

  providers: [
    ScheduleService,
    PermissionsGuard,
  ],
})
export class SchedulingModule {}
