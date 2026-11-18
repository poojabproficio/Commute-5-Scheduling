
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeeSchedule } from './entities/employee-schedule.entity.js';
import { PairShiftMapping } from './entities/pair-shift-mapping.entity.js';
import { ScheduleRequest } from './entities/schedule-request.entity.js';
import { ScheduleRequestItem } from './entities/schedule-request-item.entity.js';

import { Employee } from '../Employee/entities/employee.entity.js';
import { Shift } from '../Shift/entities/shift.entity.js';
import { Campus } from '../campus/entities/campus.entity.js';
import { User } from '../user/entities/user.entity.js';
import { Schedule } from '../scheduling/entities/scheduling.entity.js';
import { Holiday } from '../holiday/entities/holiday.entity/holiday.entity.js';

import { ScheduleViewerService } from './schedule-viewer.service.js';
import { ScheduleViewerController } from './schedule-viewer.controller.js';

import { RolePermission } from '../role-permission/entities/role-permission.entity.js';
import { Permission } from '../permission/entities/permission.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeSchedule,
      PairShiftMapping,
      ScheduleRequest,
      ScheduleRequestItem,
      Employee,
      Shift,
      Campus,
      User,
      Schedule,
      Holiday,
        RolePermission,
  Permission,
    ]),
  ],
  providers: [ScheduleViewerService],
  controllers: [ScheduleViewerController],
  exports: [ScheduleViewerService],
})
export class ScheduleViewerModule {}
