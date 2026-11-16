
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHolidayTable1794787300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('dbo.holiday', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.holiday (
          id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

          created_by VARCHAR(100) NOT NULL,
          updated_by VARCHAR(100) NULL,
          created_at DATETIME2 NOT NULL
            CONSTRAINT DF_holiday_created_at DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL
            CONSTRAINT DF_holiday_updated_at DEFAULT GETDATE(),
          deleted_at DATETIME2 NULL,

          campus_id INT NOT NULL,

          name VARCHAR(150) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,

          holiday_type VARCHAR(20) NOT NULL,
          is_recurring BIT NOT NULL
            CONSTRAINT DF_holiday_is_recurring DEFAULT 0,
          block_scheduling BIT NOT NULL
            CONSTRAINT DF_holiday_block_scheduling DEFAULT 1,

          notes VARCHAR(500) NULL,

          CONSTRAINT FK_holiday_Campus
            FOREIGN KEY (campus_id)
            REFERENCES dbo.Campus(id),

          CONSTRAINT CK_holiday_date_range
            CHECK (end_date >= start_date),

          CONSTRAINT CK_holiday_type
            CHECK (
              holiday_type IN (
                'NATIONAL',
                'REGIONAL',
                'COMPANY',
                'OPTIONAL'
              )
            )
        );

        CREATE INDEX IX_holiday_campus_dates
        ON dbo.holiday (campus_id, start_date, end_date)
        WHERE deleted_at IS NULL;
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('dbo.holiday', 'U') IS NOT NULL
      BEGIN
        DROP TABLE dbo.holiday;
      END;
    `);
  }
}
