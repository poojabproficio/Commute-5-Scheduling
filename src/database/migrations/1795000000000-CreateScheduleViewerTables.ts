
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScheduleViewerTables1795000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {

    // 1. Employee Schedule
    await queryRunner.query(`
      CREATE TABLE dbo.employee_schedule (
        id INT IDENTITY(1,1) NOT NULL,

        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100) NULL,
        created_at DATETIME2 NOT NULL
          CONSTRAINT DF_employee_schedule_created_at DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL
          CONSTRAINT DF_employee_schedule_updated_at DEFAULT GETDATE(),
        deleted_at DATETIME2 NULL,

        employee_id INT NOT NULL,
        login_date DATE NOT NULL,

        login_shift_id INT NULL,
        login_status VARCHAR(20) NULL,
        login_source VARCHAR(20) NULL,
        login_updated_at DATETIME2 NULL,
        login_updated_by INT NULL,
        login_override_reason VARCHAR(500) NULL,

        logout_date DATE NULL,
        logout_shift_id INT NULL,
        logout_status VARCHAR(20) NULL,
        logout_source VARCHAR(20) NULL,
        logout_updated_at DATETIME2 NULL,
        logout_updated_by INT NULL,
        logout_override_reason VARCHAR(500) NULL,

        CONSTRAINT PK_employee_schedule PRIMARY KEY (id),

        CONSTRAINT FK_employee_schedule_Employee
          FOREIGN KEY (employee_id)
          REFERENCES dbo.Employee(id),

        CONSTRAINT FK_employee_schedule_LoginShift
          FOREIGN KEY (login_shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT FK_employee_schedule_LogoutShift
          FOREIGN KEY (logout_shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT FK_employee_schedule_LoginUpdatedBy
          FOREIGN KEY (login_updated_by)
          REFERENCES dbo.[User](id),

        CONSTRAINT FK_employee_schedule_LogoutUpdatedBy
          FOREIGN KEY (logout_updated_by)
          REFERENCES dbo.[User](id),

        CONSTRAINT CK_employee_schedule_at_least_one_shift
          CHECK (
            login_shift_id IS NOT NULL
            OR logout_shift_id IS NOT NULL
          ),

        CONSTRAINT CK_employee_schedule_logout_date
          CHECK (
            logout_date IS NULL
            OR DATEDIFF(DAY, login_date, logout_date) IN (0, 1)
          ),

        CONSTRAINT CK_employee_schedule_login_status
          CHECK (
            login_status IS NULL
            OR login_status IN ('SCHEDULED', 'CANCELLED')
          ),

        CONSTRAINT CK_employee_schedule_logout_status
          CHECK (
            logout_status IS NULL
            OR logout_status IN ('SCHEDULED', 'CANCELLED')
          ),

        CONSTRAINT CK_employee_schedule_login_source
          CHECK (
            login_source IS NULL
            OR login_source IN (
              'EMPLOYEE', 'MANAGER', 'ADMIN', 'UPLOAD', 'APPROVAL'
            )
          ),

        CONSTRAINT CK_employee_schedule_logout_source
          CHECK (
            logout_source IS NULL
            OR logout_source IN (
              'EMPLOYEE', 'MANAGER', 'ADMIN', 'UPLOAD', 'APPROVAL'
            )
          )
      );

      CREATE UNIQUE NONCLUSTERED INDEX
        UQ_employee_schedule_employee_login_date
      ON dbo.employee_schedule (employee_id, login_date)
      WHERE deleted_at IS NULL;
    `);


    // 2. Employee-specific Login / Logout Shift Pairing
    await queryRunner.query(`
      CREATE TABLE dbo.pair_shift_mapping (
        id INT IDENTITY(1,1) NOT NULL,

        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100) NULL,
        created_at DATETIME2 NOT NULL
          CONSTRAINT DF_pair_shift_mapping_created_at DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL
          CONSTRAINT DF_pair_shift_mapping_updated_at DEFAULT GETDATE(),
        deleted_at DATETIME2 NULL,

        employee_id INT NOT NULL,
        shift_id INT NOT NULL,
        paired_shift_id INT NOT NULL,

        CONSTRAINT PK_pair_shift_mapping PRIMARY KEY (id),

        CONSTRAINT FK_pair_shift_mapping_Employee
          FOREIGN KEY (employee_id)
          REFERENCES dbo.Employee(id),

        CONSTRAINT FK_pair_shift_mapping_LoginShift
          FOREIGN KEY (shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT FK_pair_shift_mapping_LogoutShift
          FOREIGN KEY (paired_shift_id)
          REFERENCES dbo.Shift(id)
      );

      CREATE UNIQUE NONCLUSTERED INDEX
        UQ_pair_shift_mapping_employee_login_shift
      ON dbo.pair_shift_mapping (employee_id, shift_id)
      WHERE deleted_at IS NULL;
    `);


    // 3. Schedule Request Header
    await queryRunner.query(`
      CREATE TABLE dbo.schedule_request (
        id INT IDENTITY(1,1) NOT NULL,

        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100) NULL,
        created_at DATETIME2 NOT NULL
          CONSTRAINT DF_schedule_request_created_at DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL
          CONSTRAINT DF_schedule_request_updated_at DEFAULT GETDATE(),
        deleted_at DATETIME2 NULL,

        employee_id INT NOT NULL,
        submitted_at DATETIME2 NOT NULL,
        request_status VARCHAR(20) NOT NULL,
        failure_reason VARCHAR(500) NULL,
        submitted_by INT NULL,

        CONSTRAINT PK_schedule_request PRIMARY KEY (id),

        CONSTRAINT FK_schedule_request_Employee
          FOREIGN KEY (employee_id)
          REFERENCES dbo.Employee(id),

        CONSTRAINT FK_schedule_request_SubmittedBy
          FOREIGN KEY (submitted_by)
          REFERENCES dbo.[User](id),

        CONSTRAINT CK_schedule_request_status
          CHECK (request_status IN ('ACCEPTED', 'REJECTED'))
      );

      CREATE NONCLUSTERED INDEX IX_schedule_request_employee_submitted
      ON dbo.schedule_request (employee_id, submitted_at);
    `);


    // 4. Schedule Request Items
    await queryRunner.query(`
      CREATE TABLE dbo.schedule_request_item (
        id INT IDENTITY(1,1) NOT NULL,

        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100) NULL,
        created_at DATETIME2 NOT NULL
          CONSTRAINT DF_schedule_request_item_created_at DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL
          CONSTRAINT DF_schedule_request_item_updated_at DEFAULT GETDATE(),
        deleted_at DATETIME2 NULL,

        request_id INT NOT NULL,
        employee_schedule_id INT NULL,

        login_date DATE NOT NULL,
        original_login_date DATE NULL,
        requested_login_date DATE NULL,

        request_type VARCHAR(30) NOT NULL,

        original_login_shift_id INT NULL,
        requested_login_shift_id INT NULL,
        original_logout_shift_id INT NULL,
        requested_logout_shift_id INT NULL,

        original_login_status VARCHAR(20) NULL,
        original_logout_status VARCHAR(20) NULL,

        item_status VARCHAR(20) NOT NULL,
        failure_reason VARCHAR(500) NULL,
        processed_at DATETIME2 NULL,

        CONSTRAINT PK_schedule_request_item PRIMARY KEY (id),

        CONSTRAINT FK_schedule_request_item_Request
          FOREIGN KEY (request_id)
          REFERENCES dbo.schedule_request(id),

        CONSTRAINT FK_schedule_request_item_EmployeeSchedule
          FOREIGN KEY (employee_schedule_id)
          REFERENCES dbo.employee_schedule(id),

        CONSTRAINT FK_schedule_request_item_OriginalLoginShift
          FOREIGN KEY (original_login_shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT FK_schedule_request_item_RequestedLoginShift
          FOREIGN KEY (requested_login_shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT FK_schedule_request_item_OriginalLogoutShift
          FOREIGN KEY (original_logout_shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT FK_schedule_request_item_RequestedLogoutShift
          FOREIGN KEY (requested_logout_shift_id)
          REFERENCES dbo.Shift(id),

        CONSTRAINT CK_schedule_request_item_type
          CHECK (
            request_type IN (
              'LOGIN_CHANGE',
              'LOGOUT_CHANGE',
              'CANCEL_LOGIN',
              'CANCEL_LOGOUT',
              'CANCEL_DUTY',
              'ADD_DUTY',
              'CHANGE_DATE'
            )
          ),

        CONSTRAINT CK_schedule_request_item_status
          CHECK (item_status IN ('ACCEPTED', 'REJECTED'))
      );

      CREATE NONCLUSTERED INDEX IX_schedule_request_item_request
      ON dbo.schedule_request_item (request_id);

      CREATE NONCLUSTERED INDEX IX_schedule_request_item_schedule
      ON dbo.schedule_request_item (employee_schedule_id)
      WHERE employee_schedule_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    // Drop child table first because it references the other tables.
    await queryRunner.query(`
      IF OBJECT_ID('dbo.schedule_request_item', 'U') IS NOT NULL
        DROP TABLE dbo.schedule_request_item;
    `);

    await queryRunner.query(`
      IF OBJECT_ID('dbo.schedule_request', 'U') IS NOT NULL
        DROP TABLE dbo.schedule_request;
    `);

    await queryRunner.query(`
      IF OBJECT_ID('dbo.pair_shift_mapping', 'U') IS NOT NULL
        DROP TABLE dbo.pair_shift_mapping;
    `);

    await queryRunner.query(`
      IF OBJECT_ID('dbo.employee_schedule', 'U') IS NOT NULL
        DROP TABLE dbo.employee_schedule;
    `);
  }
}
