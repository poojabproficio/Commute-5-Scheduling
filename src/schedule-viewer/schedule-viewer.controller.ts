
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { Request } from 'express';

import { ScheduleViewerService } from './schedule-viewer.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permission.guard.js';

import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PermissionModule } from '../common/enums/permission-module.enum.js';
import { PermissionAction } from '../common/enums/permission-action.enum.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    campusId: number;
    roleId: number;
    roleCode: string;
  };
}

@Controller('schedule-viewer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScheduleViewerController {
  constructor(
    private readonly scheduleViewerService: ScheduleViewerService,
  ) {}

  // Existing Schedule Viewer API
  @Get()
  @Permissions(PermissionModule.SCHEDULING, PermissionAction.VIEW)
  async getViewerData(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Both startDate and endDate are required.',
      );
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
      throw new BadRequestException(
        'Dates must use YYYY-MM-DD format.',
      );
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'startDate cannot be later than endDate.',
      );
    }

    return this.scheduleViewerService.getViewerData(
      req.user,
      startDate,
      endDate,
    );
  }

  // Get employee login/logout shift pairings
  @Get('shift-pairs')
  @Permissions(PermissionModule.SCHEDULING, PermissionAction.VIEW)
  async getShiftPairs(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.scheduleViewerService.getShiftPairs(req.user);
  }
}
