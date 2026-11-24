
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CampusWideShiftPairMapping1795506947626
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old employee-specific mappings.
    // We are intentionally starting the campus-wide configuration empty.
    await queryRunner.query(`
      DELETE FROM dbo.pair_shift_mapping;
    `);

    // Remove the old employee-specific unique index.
    await queryRunner.query(`
      DROP INDEX [UQ_pair_shift_mapping_employee_login_shift]
      ON dbo.pair_shift_mapping;
    `);

    // Remove the Employee foreign key.
    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      DROP CONSTRAINT [FK_pair_shift_mapping_Employee];
    `);

    // Replace employee_id with campus_id.
    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      DROP COLUMN [employee_id];
    `);

    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      ADD [campus_id] int NOT NULL;
    `);

    // Add Campus foreign key.
    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      ADD CONSTRAINT [FK_pair_shift_mapping_Campus]
      FOREIGN KEY ([campus_id])
      REFERENCES dbo.Campus([id]);
    `);

    // One LOGIN shift can have only one LOGOUT mapping per campus.
    await queryRunner.query(`
      CREATE UNIQUE NONCLUSTERED INDEX
      [UQ_pair_shift_mapping_campus_login_shift]
      ON dbo.pair_shift_mapping ([campus_id], [shift_id])
      WHERE [deleted_at] IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove campus-wide mappings before restoring the old structure.
    await queryRunner.query(`
      DELETE FROM dbo.pair_shift_mapping;
    `);

    await queryRunner.query(`
      DROP INDEX [UQ_pair_shift_mapping_campus_login_shift]
      ON dbo.pair_shift_mapping;
    `);

    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      DROP CONSTRAINT [FK_pair_shift_mapping_Campus];
    `);

    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      DROP COLUMN [campus_id];
    `);

    // Restore employee_id as the old required column.
    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      ADD [employee_id] int NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE dbo.pair_shift_mapping
      ADD CONSTRAINT [FK_pair_shift_mapping_Employee]
      FOREIGN KEY ([employee_id])
      REFERENCES dbo.Employee([id]);
    `);

    await queryRunner.query(`
      CREATE UNIQUE NONCLUSTERED INDEX
      [UQ_pair_shift_mapping_employee_login_shift]
      ON dbo.pair_shift_mapping ([employee_id], [shift_id])
      WHERE [deleted_at] IS NULL;
    `);
  }
}
