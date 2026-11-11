
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchedule1794376653729
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID(N'dbo.schedule', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[schedule] (
          [id] INT IDENTITY(1,1) NOT NULL,

          -- Audit fields
          [created_by] NVARCHAR(100) NOT NULL,
          [updated_by] NVARCHAR(100) NULL,
          [created_at] DATETIME2 NOT NULL
            CONSTRAINT [DF_schedule_created_at] DEFAULT (GETDATE()),
          [updated_at] DATETIME2 NOT NULL
            CONSTRAINT [DF_schedule_updated_at] DEFAULT (GETDATE()),
          [deleted_at] DATETIME2 NULL,

          -- Campus
          [campus_id] INT NOT NULL,

          -- Working days
          [works_mon] BIT NOT NULL DEFAULT 1,
          [works_tue] BIT NOT NULL DEFAULT 1,
          [works_wed] BIT NOT NULL DEFAULT 1,
          [works_thu] BIT NOT NULL DEFAULT 1,
          [works_fri] BIT NOT NULL DEFAULT 1,
          [works_sat] BIT NOT NULL DEFAULT 0,
          [works_sun] BIT NOT NULL DEFAULT 0,

          [min_working_days_per_week] TINYINT NOT NULL DEFAULT 4,
          [block_weekends] BIT NOT NULL DEFAULT 1,
          [block_holidays] BIT NOT NULL DEFAULT 1,

          -- Shift configuration
          [interlock_login_logout] BIT NOT NULL DEFAULT 0,
          [shift_source] VARCHAR(20) NOT NULL
            CONSTRAINT [DF_schedule_shift_source]
            DEFAULT ('INDIVIDUAL'),

          -- Advance scheduling
          [max_advance_days] SMALLINT NOT NULL DEFAULT 14,
          [allow_sat_for_monday] BIT NOT NULL DEFAULT 0,
          [allow_sun_for_monday] BIT NOT NULL DEFAULT 0,

          -- Weekly cutoff
          [weekly_cutoff_enabled] BIT NOT NULL DEFAULT 0,
          [weekly_cutoff_day] TINYINT NULL,
          [weekly_cutoff_time] TIME NULL,

          -- Daily cutoff
          [daily_cutoff_enabled] BIT NOT NULL DEFAULT 0,
          [daily_cutoff_type] VARCHAR(20) NULL,
          [daily_cutoff_day_offset] TINYINT NULL,
          [daily_cutoff_time] TIME NULL,
          [login_hours_prior] SMALLINT NULL,
          [logout_hours_prior] SMALLINT NULL,

          -- Behaviour
          [interlock_schedule_adhoc] BIT NOT NULL DEFAULT 0,
          [revoke_cancellation] BIT NOT NULL DEFAULT 0,
          [send_email_confirmation] BIT NOT NULL DEFAULT 0,

          -- Approval
          [approval_enabled] BIT NOT NULL DEFAULT 0,
          [approver_scope] VARCHAR(20) NULL,

          CONSTRAINT [PK_schedule]
            PRIMARY KEY ([id]),

          CONSTRAINT [FK_schedule_Campus]
            FOREIGN KEY ([campus_id])
            REFERENCES [dbo].[Campus]([id])
            ON DELETE NO ACTION
        );

        CREATE UNIQUE INDEX [UQ_schedule_campus_id]
        ON [dbo].[schedule] ([campus_id]);
      END
      ELSE
      BEGIN
        -- The table already exists in the shared Commute5 database.
        -- Add only the column missing from the existing table.
        IF COL_LENGTH(N'dbo.schedule', N'shift_source') IS NULL
        BEGIN
          ALTER TABLE [dbo].[schedule]
          ADD [shift_source] VARCHAR(20) NOT NULL
            CONSTRAINT [DF_schedule_shift_source]
            DEFAULT ('INDIVIDUAL');
        END
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a baseline/adoption migration for a shared database.
    // Do not drop dbo.schedule because it may have existed before
    // this backend took ownership of Scheduling migrations.
  }
}
