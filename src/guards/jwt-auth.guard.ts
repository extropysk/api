import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Config } from 'src/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secret: string;

  constructor(
    private readonly configService: ConfigService<Config, true>,
    private readonly reflector: Reflector,
  ) {
    this.secret = this.configService.get('jwt');
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
      context.getHandler(),
      context.getClass(),
    ]);

    const isOptional = this.reflector.getAllAndOverride<boolean>('OPTIONAL', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      if (isOptional) return true;
      throw new UnauthorizedException();
    }

    try {
      const payload = jwt.verify(token, 'qweqw') as JwtPayload;

      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };

      (request as any).user = user;
      (request as any).session = { user, session: null };

      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        'ROLES',
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles?.length) {
        const userRole = payload.role ?? '';
        if (!requiredRoles.includes(userRole)) {
          throw new ForbiddenException('Insufficient role');
        }
      }

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (isOptional) return true;
      throw new UnauthorizedException();
    }
  }

  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
