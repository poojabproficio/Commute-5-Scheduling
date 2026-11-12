
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginLogoutMinutesPrior1794481200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add login minutes column
    await queryRunner.query(`
      IF COL_LENGTH('dbo.schedule', 'login_minutes_prior') IS NULL
      BEGIN
        ALTER TABLE [dbo].[schedule]
        ADD [login_minutes_prior] SMALLINT NULL;
      END;
    `);

    // Add logout minutes column
    await queryRunner.query(`
      IF COL_LENGTH('dbo.schedule', 'logout_minutes_prior') IS NULL
      BEGIN
        ALTER TABLE [dbo].[schedule]
        ADD [logout_minutes_prior] SMALLINT NULL;
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove logout minutes column
    await queryRunner.query(`
      IF COL_LENGTH('dbo.schedule', 'logout_minutes_prior') IS NOT NULL
      BEGIN
        ALTER TABLE [dbo].[schedule]
        DROP COLUMN [logout_minutes_prior];
      END;
    `);

    // Remove login minutes column
    await queryRunner.query(`
      IF COL_LENGTH('dbo.schedule', 'login_minutes_prior') IS NOT NULL
      BEGIN
        ALTER TABLE [dbo].[schedule]
        DROP COLUMN [login_minutes_prior];
      END;
    `);
  }
}
