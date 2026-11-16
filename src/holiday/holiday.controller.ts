
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { HolidayService } from './holiday.service.js';



import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../common/guards/permission.guard.js';
import { PermissionModule } from '../common/enums/permission-module.enum.js';
import { PermissionAction } from '../common/enums/permission-action.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto/holiday.dto.js';

@Controller('holiday')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HolidayController {
  constructor(
    private readonly holidayService: HolidayService,
  ) {}

  // ==========================================
  // CREATE HOLIDAY
  // ==========================================

  @Post()
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.CREATE,
  )
  create(
    @Body() dto: CreateHolidayDto,
    @Req() req: any,
  ) {
    return this.holidayService.create(
      dto,
      req.user,
    );
  }

  // ==========================================
  // GET HOLIDAYS
  // ==========================================

  @Get()
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.VIEW,
  )
  findAll(
    @Req() req: any,
    @Query('year') year?: string,
  ) {
    return this.holidayService.findAll(
      req.user,
      year,
    );
  }

  // ==========================================
  // GET CALENDAR
  // ==========================================

  @Get('calendar')
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.VIEW,
  )
  getCalendar(
    @Req() req: any,
    @Query('year') year?: string,
  ) {
    return this.holidayService.getCalendar(
      req.user,
      year,
    );
  }

  // ==========================================
  // GET HOLIDAY KPIs
  // ==========================================

  @Get('kpis')
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.VIEW,
  )
  getKpis(
    @Req() req: any,
    @Query('year') year?: string,
  ) {
    return this.holidayService.getKpis(
      req.user,
      year,
    );
  }

  // ==========================================
  // UPDATE HOLIDAY
  // ==========================================

  @Patch(':id')
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.UPDATE,
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayDto,
    @Req() req: any,
  ) {
    return this.holidayService.update(
      id,
      dto,
      req.user,
    );
  }

  // ==========================================
  // DELETE HOLIDAY (SOFT DELETE)
  // ==========================================

  @Delete(':id')
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.DELETE,
  )
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.holidayService.remove(
      id,
      req.user,
    );
  }

  // ==========================================
  // COPY FROM LAST YEAR
  // ==========================================

  @Post('copy-from-last-year')
  @Permissions(
    PermissionModule.HOLIDAY,
    PermissionAction.CREATE,
  )
  copyFromLastYear(
    @Body('year') year: number,
    @Req() req: any,
  ) {
    return this.holidayService.copyFromLastYear(
      year,
      req.user,
    );
  }
}
