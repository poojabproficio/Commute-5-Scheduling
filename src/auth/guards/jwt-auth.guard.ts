
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: any,
    status?: any,
  ): TUser {

    const authenticatedUser = super.handleRequest(
      err,
      user,
      info,
      context,
      status,
    ) as any;

    if (authenticatedUser?.purpose !== 'ACCESS') {
      throw new UnauthorizedException('Invalid access token');
    }

    return authenticatedUser as TUser;
  }
}
