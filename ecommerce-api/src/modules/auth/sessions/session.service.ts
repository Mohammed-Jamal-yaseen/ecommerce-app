import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../lib/database/prisma.service';
import { TokenHasherService } from '../../../lib/security/hashing/token-hasher.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenHasher: TokenHasherService,
    private readonly configService: ConfigService,
  ) {}

  getRefreshTokenExpiresAt(): Date {
    const ttlSeconds = this.configService.getOrThrow<number>(
      'auth.refreshTokenTtlSeconds',
    );

    return new Date(Date.now() + ttlSeconds * 1000);
  }

  async createSession(params: {
    sid: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }) {
    const refreshTokenHash = await this.tokenHasher.hash(params.refreshToken);

    return this.prisma.session.create({
      data: {
        id: params.sid,
        userId: params.userId,
        token: refreshTokenHash,
        expiresAt: params.expiresAt,
        ipAddress: params.ip,
        userAgent: params.userAgent,
      },
    });
  }

  async getSessionById(sid: string) {
    return this.prisma.session.findUnique({ where: { id: sid } });
  }

  async validateRefreshSession(
    userId: string,
    sid: string,
    refreshToken: string,
  ): Promise<boolean> {
    const session = await this.getSessionById(sid);
    if (!session) return false;
    if (session.userId !== userId) return false;
    if (session.expiresAt <= new Date()) return false;

    return this.tokenHasher.verify(refreshToken, session.token);
  }

  async rotateSession(
    sid: string,
    userId: string,
    currentRefreshToken: string,
    nextRefreshToken: string,
  ): Promise<boolean> {
    const session = await this.getSessionById(sid);
    if (!session) return false;
    if (session.userId !== userId) return false;
    if (session.expiresAt <= new Date()) return false;

    const isValid = await this.tokenHasher.verify(
      currentRefreshToken,
      session.token,
    );
    if (!isValid) {
      return false;
    }

    const nextTokenHash = await this.tokenHasher.hash(nextRefreshToken);
    const expiresAt = this.getRefreshTokenExpiresAt();

    const result = await this.prisma.session.updateMany({
      where: {
        id: sid,
        userId,
        expiresAt: { gt: new Date() },
        token: session.token,
      },
      data: {
        token: nextTokenHash,
        expiresAt,
      },
    });

    return result.count === 1;
  }

  async revokeSession(sid: string, userId: string): Promise<boolean> {
    const session = await this.getSessionById(sid);
    if (!session) return false;
    if (session.userId !== userId) return false;

    await this.prisma.session.delete({ where: { id: sid } });
    return true;
  }

  async revokeAllSessionsForUser(userId: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({ where: { userId } });
    return result.count;
  }
}
