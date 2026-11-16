
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';

import { HolidayController } from './holiday.controller.js';
import { HolidayService } from './holiday.service.js';


import { Campus } from '../campus/entities/campus.entity.js';

import { PermissionsGuard } from '../common/guards/permission.guard.js';
import { RolePermission } from '../role-permission/entities/role-permission.entity.js';
import { Permission } from '../permission/entities/permission.entity.js';
import { Holiday } from './entities/holiday.entity/holiday.entity.js';

@Module({
  imports: [
    AuthModule,

    TypeOrmModule.forFeature([
      Holiday,
      Campus,
      RolePermission,
      Permission,
    ]),
  ],

  controllers: [HolidayController],

  providers: [
    HolidayService,
    PermissionsGuard,
  ],
})
export class HolidayModule {}
