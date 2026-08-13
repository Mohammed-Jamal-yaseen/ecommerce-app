import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as PassportJwtStrategy } from 'passport-jwt';
import type { Request } from 'express';

export type RefreshAuthenticatedUser = {
  id: string;
  sid: string;
  refreshToken: string;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  PassportJwtStrategy,
  'refresh-token',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('auth.refreshSecret'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: { sub: string; sid?: string },
  ): RefreshAuthenticatedUser {
    const authHeader = req.headers['authorization'];
    const refreshToken =
      typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    if (!payload.sid) {
      throw new UnauthorizedException('Refresh token missing session id');
    }

    return {
      id: payload.sub,
      sid: payload.sid,
      refreshToken,
    };
  }
}
