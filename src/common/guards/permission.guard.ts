
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { RolePermission } from '../../role-permission/entities/role-permission.entity.js';
import { Permission } from '../../permission/entities/permission.entity.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // If an endpoint has no permission metadata, allow it
    // to proceed to the next application-level checks.
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new UnauthorizedException('User authentication required');
    }

    // SUPPORT bypass is allowed only when roleCode has
    // already been validated against the database by JwtStrategy.
    if (user.roleCode?.toUpperCase() === 'SUPPORT') {
      return true;
    }

    // Find the requested permission in the existing Permission table.
    const permission = await this.permissionRepository.findOne({
      where: {
        module: requiredPermission.module,
        action: requiredPermission.action,
        deleted_at: IsNull(),
      },
    });

    if (!permission) {
      throw new ForbiddenException('Permission not found');
    }

    // Check whether this role has that permission.
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        roleId: user.roleId,
        permissionId: permission.id,
        deleted_at: IsNull(),
      },
    });

    if (!rolePermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
