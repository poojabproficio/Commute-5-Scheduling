
import {
  Controller,
  Get,
    Delete,
  Patch,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { Request } from 'express';

import { ScheduleViewerService } from './schedule-viewer.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permission.guard.js';

import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PermissionModule } from '../common/enums/permission-module.enum.js';
import { PermissionAction } from '../common/enums/permission-action.enum.js';
import { UpdateShiftPairDto } from './dto/update-shift-pair.dto.js';
import {
  Post,
  Body,
} from '@nestjs/common';

import { CreateShiftPairDto } from './dto/create-shift-pair.dto.js';

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

  @Post('shift-pairs')
@Permissions(PermissionModule.SCHEDULING, PermissionAction.CREATE)
async createShiftPair(
  @Req() req: AuthenticatedRequest,
  @Body() dto: CreateShiftPairDto,
) {
  return this.scheduleViewerService.createShiftPair(
    req.user,
    dto,
  );
}

@Patch('shift-pairs/:id')
@Permissions(PermissionModule.SCHEDULING, PermissionAction.UPDATE)
async updateShiftPair(
  @Req() req: AuthenticatedRequest,
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateShiftPairDto,
) {
  return this.scheduleViewerService.updateShiftPair(
    req.user,
    id,
    dto,
  );
}

@Delete('shift-pairs/:id')
@Permissions(PermissionModule.SCHEDULING, PermissionAction.DELETE)
async deleteShiftPair(
  @Req() req: AuthenticatedRequest,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.scheduleViewerService.deleteShiftPair(
    req.user,
    id,
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
