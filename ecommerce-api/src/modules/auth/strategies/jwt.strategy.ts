import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as PassportJwtStrategy } from 'passport-jwt';
import { PrismaService } from '../../../lib/database/prisma.service';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(PassportJwtStrategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('auth.jwtSecret'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: string;
  }): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }
}
