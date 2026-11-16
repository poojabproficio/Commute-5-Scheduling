
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHolidayPermissions1794787200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Check that the required roles exist.
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

    // 2. Create Holiday permissions if they do not already exist.
    const permissions = [
      'VIEW',
      'CREATE',
      'UPDATE',
      'DELETE',
    ];

    for (const action of permissions) {
      await queryRunner.query(
        `
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.Permission
          WHERE Module = @0
            AND Action = @1
            AND deleted_at IS NULL
        )
        BEGIN
          INSERT INTO dbo.Permission
            (created_by, Module, Action, Description)
          VALUES
            (@2, @0, @1, @3);
        END
        `,
        [
          'HOLIDAY',
          action,
          'SYSTEM',
          `can ${action} HOLIDAY`,
        ],
      );
    }

    // 3. Assign all Holiday permissions to ADMIN and ADMINMAAZ.
    // Avoid duplicate active role-permission assignments.
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
        AND p.Module = 'HOLIDAY'
        AND p.Action IN ('VIEW', 'CREATE', 'UPDATE', 'DELETE')
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
  }
}
