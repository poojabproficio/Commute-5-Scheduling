
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ScheduleService } from './scheduling.service.js';
import { ScheduleDto } from './dto/scheduling.dto.js';




import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../common/guards/permission.guard.js';
import { PermissionModule } from '../comman/enums/permission-module.enum.js';
import { PermissionAction } from '../comman/enums/permission-action.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';


@Controller('scheduling')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
  ) {}

  // ==========================================
  // CREATE SCHEDULE
  // ==========================================

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(
    PermissionModule.SCHEDULING,
    PermissionAction.CREATE,
  )
  create(
    @Body() dto: ScheduleDto,
    @Req() req: any,
  ) {
    return this.scheduleService.createForCampus(
      dto,
      req.user,
    );
  }

  // ==========================================
  // GET SCHEDULE
  // ==========================================

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(
    PermissionModule.SCHEDULING,
    PermissionAction.VIEW,
  )
  findForCampus(@Req() req: any) {
    return this.scheduleService.findForCampus(
      req.user,
    );
  }

  // ==========================================
  // UPDATE SCHEDULE
  // ==========================================

  @Patch()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(
    PermissionModule.SCHEDULING,
    PermissionAction.UPDATE,
  )
  update(
    @Body() dto: ScheduleDto,
    @Req() req: any,
  ) {
    return this.scheduleService.updateForCampus(
      dto,
      req.user,
    );
  }
}
