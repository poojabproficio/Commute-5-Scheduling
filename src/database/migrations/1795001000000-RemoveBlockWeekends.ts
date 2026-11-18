
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveBlockWeekends1795001000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH('dbo.scheduling_configuration', 'block_weekends') IS NOT NULL
      BEGIN
        DECLARE @sql NVARCHAR(MAX);

        SELECT @sql =
          N'ALTER TABLE dbo.scheduling_configuration DROP CONSTRAINT '
          + QUOTENAME(dc.name)
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
          AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id =
          OBJECT_ID(N'dbo.scheduling_configuration')
          AND c.name = 'block_weekends';

        IF @sql IS NOT NULL
        BEGIN
          EXEC sys.sp_executesql @sql;
        END;

        ALTER TABLE dbo.scheduling_configuration
        DROP COLUMN block_weekends;
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH('dbo.scheduling_configuration', 'block_weekends') IS NULL
      BEGIN
        ALTER TABLE dbo.scheduling_configuration
        ADD block_weekends BIT NOT NULL
        CONSTRAINT DF_scheduling_configuration_block_weekends
        DEFAULT (1);
      END;
    `);
  }
}
