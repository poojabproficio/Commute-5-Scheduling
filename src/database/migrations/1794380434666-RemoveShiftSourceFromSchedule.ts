
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveShiftSourceFromSchedule1794380434666
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.schedule', N'shift_source') IS NOT NULL
      BEGIN
        -- Remove the default constraint first.
        IF EXISTS (
          SELECT 1
          FROM sys.default_constraints
          WHERE name = 'DF_schedule_shift_source'
            AND parent_object_id = OBJECT_ID(N'dbo.schedule')
        )
        BEGIN
          ALTER TABLE [dbo].[schedule]
          DROP CONSTRAINT [DF_schedule_shift_source];
        END;

        -- Now remove the column.
        ALTER TABLE [dbo].[schedule]
        DROP COLUMN [shift_source];
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the column if this migration is reverted.
    await queryRunner.query(`
      IF OBJECT_ID(N'dbo.schedule', N'U') IS NOT NULL
         AND COL_LENGTH(N'dbo.schedule', N'shift_source') IS NULL
      BEGIN
        ALTER TABLE [dbo].[schedule]
        ADD [shift_source] VARCHAR(20) NOT NULL
          CONSTRAINT [DF_schedule_shift_source]
          DEFAULT ('INDIVIDUAL');
      END;
    `);
  }
}
