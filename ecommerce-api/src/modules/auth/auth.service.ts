import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { PasswordHasherService } from '../../lib/security/hashing/password-hasher.service';
import { JwtService } from '../../lib/security/jwt/jwt.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SessionService } from './sessions/session.service';
import { AuthRequestContext, AuthUser } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!dto.acceptedTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.usersService.findByEmail(email);

    // Check if a user with the same email already exists
    if (existingUser) {
      throw new ConflictException(
        'Unable to create account with these credentials',
      );
    }
    // Hash the password and create the user
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // Create the user and return the session response
    const user = await this.usersService.createCredentialUser({
      name: dto.name.trim(),
      email,
      passwordHash,
      acceptedTerms: true,
    });

    return this.createSessionResponse(user);
  }

  /**
   * Logs in the user and creates a new session.
   * @param dto The login DTO containing email and password.
   * @param context Optional request context containing IP and user agent information.
   * @returns A promise resolving to the authentication response.
   */
  async login(
    dto: LoginDto,
    context?: AuthRequestContext,
  ): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersService.findCredentialUser(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordHasher.verify(
      user.passwordHash,
      dto.password,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSessionResponse(user, context);
  }

  /**
   *  Refreshes the access token using a valid refresh token.
   *  @param refreshToken The refresh token to validate and use for refreshing the access token.
   *  @returns An AuthResponseDto containing the new access token and refresh token.
   */

  async refresh(params: {
    userId: string;
    sid: string;
    refreshToken: string;
  }): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(params.userId);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: newRefreshToken } = await this.jwtService.signRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: params.sid,
    });

    const rotated = await this.sessionService.rotateSession(
      params.sid,
      user.id,
      params.refreshToken,
      newRefreshToken,
    );

    if (!rotated) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.toAuthResponse(user, accessToken, newRefreshToken);
  }

  /**
   * Logs out the user by revoking the refresh token.
   * @param refreshToken The refresh token to revoke.
   * @returns A promise resolving to the logout result.
   */
  async logout(params: { userId: string; sid: string; refreshToken: string }) {
    await this.sessionService.revokeSession(params.sid, params.userId);

    return { ok: true };
  }

  /**
   * Logs out the user from all devices by revoking all refresh tokens.
   * @param userId The ID of the user to log out.
   * @returns A promise resolving to the logout result.
   */

  async logoutAll(userId: string): Promise<{ ok: boolean }> {
    const revoked = await this.sessionService.revokeAllSessionsForUser(userId);
    return { ok: revoked > 0 };
  }

  /**
   * Retrieves the current user by their ID.
   * @param userId The ID of the user to retrieve.
   * @returns A promise resolving to the user object.
   */

  async getCurrentUser(userId: string) {
    return this.usersService.findById(userId);
  }

  /**
   * Creates a new session for the user and returns the authentication response.
   * @param user The authenticated user.
   * @param context Optional request context containing IP and user agent information.
   * @returns The authentication response containing access and refresh tokens.
   */

  private async createSessionResponse(
    user: AuthUser,
    context?: AuthRequestContext,
  ): Promise<AuthResponseDto> {
    // Sign the access token
    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    //  sign the refresh token and create a stable session id
    const { token: refreshToken, sid } = await this.jwtService.signRefreshToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
    );

    // create a new session in the database with the refresh token and session id
    await this.sessionService.createSession({
      sid,
      userId: user.id,
      refreshToken,
      expiresAt: this.sessionService.getRefreshTokenExpiresAt(),
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    return this.toAuthResponse(user, accessToken, refreshToken);
  }

  /**
   * Converts the user and tokens into an AuthResponseDto.
   * @param user The authenticated user.  
   * @param accessToken The signed access token.
   *  @param refreshToken The signed refresh token.
   * @returns The authentication response DTO.
   * */
  private toAuthResponse(
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
  ): AuthResponseDto {
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  }

  /**
   * Normalizes the email address by trimming whitespace and converting to lowercase.
   * @param email The email address to normalize.
   * @returns The normalized email address.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
