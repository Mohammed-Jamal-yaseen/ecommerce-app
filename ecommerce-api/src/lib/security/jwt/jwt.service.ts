import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

export type RefreshTokenInput = AccessTokenPayload & {
  sid?: string;
};

export type RefreshTokenPayload = AccessTokenPayload & {
  sid: string;
};

@Injectable()
export class JwtService {
  constructor(
    private readonly jwt: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Signs an access token with the provided payload and returns the signed token.
   *   */
  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const secret = this.configService.getOrThrow<string>('auth.jwtSecret');

    const expiresIn = this.configService.getOrThrow<number>(
      'auth.accessTokenTtlSeconds',
    );

    return this.jwt.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  /**
   * Signs a refresh token and creates a stable session id when one is not provided.
   */
  async signRefreshToken(payload: RefreshTokenInput): Promise<{
    token: string;
    sid: string;
  }> {
    const secret = this.configService.getOrThrow<string>('auth.refreshSecret');

    const expiresIn = this.configService.getOrThrow<number>(
      'auth.refreshTokenTtlSeconds',
    );

    const sid = payload.sid ?? randomUUID();

    const tokenPayload: RefreshTokenPayload = {
      ...payload,
      sid,
    };

    const token = await this.jwt.signAsync(tokenPayload, {
      secret,
      expiresIn,
    });

    return {
      token,
      sid,
    };
  }

  /**
   * Verifies the access token and returns the decoded user payload.
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const secret = this.configService.getOrThrow<string>('auth.jwtSecret');

    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret,
    });
  }

  /**
   * Verifies the refresh token using the refresh secret configured for the app.
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const secret = this.configService.getOrThrow<string>('auth.refreshSecret');

    return this.jwt.verifyAsync<RefreshTokenPayload>(token, {
      secret,
    });
  }

  /**
   * Returns the refresh token expiration timestamp from the app config.
   */
  getRefreshTokenExpiresAt(): Date {
    const ttlSeconds = this.configService.getOrThrow<number>(
      'auth.refreshTokenTtlSeconds',
    );

    return new Date(Date.now() + ttlSeconds * 1000);
  }
}
