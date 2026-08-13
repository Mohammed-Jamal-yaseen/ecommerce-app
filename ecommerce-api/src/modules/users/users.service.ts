import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuthUser } from '../auth/types/auth.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new user with credential-based authentication (email and password).
   */
  async createCredentialUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    acceptedTerms?: boolean;
  }): Promise<AuthUser> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          acceptedTerms: data.acceptedTerms ?? true,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          providerId: 'credential',
          accountId: user.id,
          password: data.passwordHash,
        },
      });

      return user;
    });
  }

  /**
   * Finds a user by their email address.
   */
  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds a user with credential-based authentication (email and password).
   */
  async findCredentialUser(
    email: string,
  ): Promise<(AuthUser & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const account = await this.prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' },
    });

    if (!account?.password) {
      return null;
    }

    return {
      ...user,
      passwordHash: account.password,
    };
  }

  /**
   * Finds a user by their unique identifier.
   */
  async findById(id: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
