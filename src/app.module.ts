
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config.js';
import { SchedulingModule } from './scheduling/scheduling.module.js';
import { HolidayModule } from './holiday/holiday.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),

    SchedulingModule,
    HolidayModule,
  ],
})
export class AppModule {}
