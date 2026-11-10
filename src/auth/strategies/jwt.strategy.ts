
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { User } from '../../user/entities/user.entity.js';
import { UserCampus } from '../../user/entities/user-campus.entity.js';
import { Role } from '../../role/entities/role.entity.js';
import { PasswordPolicy } from '../../password-policy/entities/password-policy.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserCampus)
    private readonly userCampusRepository: Repository<UserCampus>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(PasswordPolicy)
    private readonly passwordPolicyRepository: Repository<PasswordPolicy>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (
      !Number.isInteger(payload.sub) ||
      !Number.isInteger(payload.campusId) ||
      !Number.isInteger(payload.roleId)
    ) {
      throw new UnauthorizedException('Invalid token information');
    }

    // 1. Find the active user.
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        isActive: true,
        deleted_at: IsNull(),
      },
      relations: {
        campus: true,
      },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    // 2. Verify the selected campus membership.
    const membership = await this.userCampusRepository.findOne({
      where: {
        userId: user.id,
        campusId: payload.campusId,
        roleId: payload.roleId,
        deleted_at: IsNull(),
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'User does not belong to the selected campus',
      );
    }

    // 3. Verify the role against the database.
    const role = await this.roleRepository.findOne({
      where: {
        id: membership.roleId,
        deleted_at: IsNull(),
      },
    });

    if (
      !role ||
      role.roleCode !== payload.roleCode
    ) {
      throw new UnauthorizedException('Invalid user role');
    }

    // 4. Check password expiry using the user's DEFAULT campus.
    if (
      payload.purpose === 'ACCESS' &&
      role.roleCode.toUpperCase() !== 'SUPPORT'
    ) {
      const policy = await this.passwordPolicyRepository.findOne({
        where: {
          campusId: user.campus.id,
          deleted_at: IsNull(),
        },
      });

      // The old backend creates a default policy with
      // PasswordExpiryDays = 0 when no policy exists.
      const expiryDays = policy?.passwordExpiryDays ?? 0;

      if (expiryDays > 0) {
        const expiresAt = new Date(user.passwordChangedAt);

        expiresAt.setUTCDate(
          expiresAt.getUTCDate() + expiryDays,
        );

        if (expiresAt.getTime() <= Date.now()) {
          throw new UnauthorizedException({
            code: 'PASSWORD_EXPIRED',
            message: 'Password has expired. Sign in again to update it.',
          });
        }
      }
    }

    // 5. Return trusted information from the database.
    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: role.id,
      roleCode: role.roleCode,
      campusId: membership.campusId,
      tokenVersion: user.tokenVersion,
      purpose: payload.purpose,
    };
  }
}
