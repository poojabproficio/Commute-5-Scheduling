
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'mssql',

    host: configService.get<string>('DB_HOST'),

    port: Number(configService.get<string>('DB_PORT')),

    username: configService.get<string>('DB_USERNAME'),

    password: configService.get<string>('DB_PASSWORD'),

    database: configService.get<string>('DB_DATABASE'),

    autoLoadEntities: true,

    synchronize: false,

    logging: true,

    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
};
 