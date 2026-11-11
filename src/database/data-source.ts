
import 'dotenv/config';

import { DataSource } from 'typeorm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const port = Number(process.env.DB_PORT ?? 1433);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('DB_PORT must be a valid positive number');
}

const dataSource = new DataSource({
  type: 'mssql',

  host: getRequiredEnv('DB_HOST'),
  port,
  username: getRequiredEnv('DB_USERNAME'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_DATABASE'),

  synchronize: false,
  logging: true,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },

  // Scheduling owns its own migration history.
  migrationsTableName: 'scheduling_migrations',

  // We will use explicit SQL migrations initially.
  entities: [],

  migrations: [
    join(currentDirectory, 'migrations', '*{.ts,.js}'),
  ],
});

export default dataSource;
