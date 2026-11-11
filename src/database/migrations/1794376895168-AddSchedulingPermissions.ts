
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchedulingPermissions1794376895168
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Verify both expected roles exist.
    const roles = await queryRunner.query(`
      SELECT RoleCode
      FROM dbo.Role
      WHERE RoleCode IN ('ADMIN', 'ADMINMAAZ')
        AND deleted_at IS NULL;
    `);

    const roleCodes = roles.map(
      (role: { RoleCode: string }) => role.RoleCode,
    );

    if (
      !roleCodes.includes('ADMIN') ||
      !roleCodes.includes('ADMINMAAZ')
    ) {
      throw new Error(
        'Required ADMIN or ADMINMAAZ role was not found.',
      );
    }

    // 2. Create missing Scheduling permissions.
    const permissions = ['VIEW', 'CREATE', 'UPDATE'];

    for (const action of permissions) {
      await queryRunner.query(
        `
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.Permission
          WHERE Module = @0
            AND Action = @1
        )
        BEGIN
          INSERT INTO dbo.Permission
            (created_by, Module, Action, Description)
          VALUES
            (@2, @0, @1, @3);
        END
        `,
        [
          'SCHEDULING',
          action,
          'SYSTEM',
          `can ${action} SCHEDULING`,
        ],
      );
    }

    // 3. Assign permissions to ADMIN and ADMINMAAZ.
    // Existing active assignments are preserved.
    await queryRunner.query(`
      INSERT INTO dbo.RolePermission
        (created_by, RoleId, PermissionId)
      SELECT
        'SYSTEM',
        r.id,
        p.id
      FROM dbo.Role r
      CROSS JOIN dbo.Permission p
      WHERE r.RoleCode IN ('ADMIN', 'ADMINMAAZ')
        AND r.deleted_at IS NULL
        AND p.Module = 'SCHEDULING'
        AND p.Action IN ('VIEW', 'CREATE', 'UPDATE')
        AND p.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.RolePermission rp
          WHERE rp.RoleId = r.id
            AND rp.PermissionId = p.id
            AND rp.deleted_at IS NULL
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally preserve existing permissions and assignments.
    // They may have existed before this backend adopted Scheduling
    // migration ownership.
  }
}
