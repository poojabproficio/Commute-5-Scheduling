
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity.js';
import { UserCampus } from '../user/entities/user-campus.entity.js';
import { Campus } from '../campus/entities/campus.entity.js';
import { Role } from '../role/entities/role.entity.js';
import { PasswordPolicy } from '../password-policy/entities/password-policy.entity.js';

import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    TypeOrmModule.forFeature([
      User,
      UserCampus,
      Campus,
      Role,
      PasswordPolicy,
    ]),
  ],

  providers: [
    JwtStrategy,
    JwtAuthGuard,
  ],

  exports: [
    JwtAuthGuard,
    PassportModule,
  ],
})
export class AuthModule {}
