
import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameHolidayAndScheduleTables1794824186846
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename holiday table
    await queryRunner.query(`
      EXEC sp_rename 'dbo.holiday', 'holiday_calendar';
    `);

    // 2. Drop the date-range constraint
    await queryRunner.query(`
      ALTER TABLE dbo.holiday_calendar
      DROP CONSTRAINT CK_holiday_date_range;
    `);

    // 3. Drop the old index because it uses end_date
    await queryRunner.query(`
      DROP INDEX IX_holiday_campus_dates
      ON dbo.holiday_calendar;
    `);

    // 4. Rename start_date to date
    await queryRunner.query(`
      EXEC sp_rename
        'dbo.holiday_calendar.start_date',
        'date',
        'COLUMN';
    `);

    // 5. Drop end_date
    await queryRunner.query(`
      ALTER TABLE dbo.holiday_calendar
      DROP COLUMN end_date;
    `);

    // 6. Recreate index using campus_id and date
    await queryRunner.query(`
      CREATE NONCLUSTERED INDEX IX_holiday_campus_dates
      ON dbo.holiday_calendar (campus_id, [date])
      WHERE deleted_at IS NULL;
    `);

    // 7. Rename schedule table
    await queryRunner.query(`
      EXEC sp_rename
        'dbo.schedule',
        'scheduling_configuration';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Restore schedule table name
    await queryRunner.query(`
      EXEC sp_rename
        'dbo.scheduling_configuration',
        'schedule';
    `);

    // 2. Drop the updated index
    await queryRunner.query(`
      DROP INDEX IX_holiday_campus_dates
      ON dbo.holiday_calendar;
    `);

    // 3. Restore end_date (previous values cannot be recovered)
    await queryRunner.query(`
      ALTER TABLE dbo.holiday_calendar
      ADD end_date date NULL;
    `);

    // 4. Restore original column name
    await queryRunner.query(`
      EXEC sp_rename
        'dbo.holiday_calendar.date',
        'start_date',
        'COLUMN';
    `);

    // 5. Restore original date-range constraint
    await queryRunner.query(`
      ALTER TABLE dbo.holiday_calendar
      ADD CONSTRAINT CK_holiday_date_range
      CHECK ([end_date] >= [start_date]);
    `);

    // 6. Restore original index
    await queryRunner.query(`
      CREATE NONCLUSTERED INDEX IX_holiday_campus_dates
      ON dbo.holiday_calendar (campus_id, start_date, end_date)
      WHERE deleted_at IS NULL;
    `);

    // 7. Restore holiday table name
    await queryRunner.query(`
      EXEC sp_rename
        'dbo.holiday_calendar',
        'holiday';
    `);
  }
}
