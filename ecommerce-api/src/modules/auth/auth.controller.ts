import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip =
      req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent =
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined;
    return this.authService.login(loginDto, { ip, userAgent });
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @CurrentUser() user: { id: string; sid: string; refreshToken: string },
  ): Promise<AuthResponseDto> {
    if (!user?.id || !user?.sid || !user?.refreshToken) {
      throw new UnauthorizedException('Refresh token context is missing');
    }

    return this.authService.refresh({
      userId: user.id,
      sid: user.sid,
      refreshToken: user.refreshToken,
    });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: { id: string; sid: string; refreshToken: string },
  ) {
    if (!user?.id || !user?.sid || !user?.refreshToken) {
      throw new UnauthorizedException('Refresh token context is missing');
    }

    await this.authService.logout({
      userId: user.id,
      sid: user.sid,
      refreshToken: user.refreshToken,
    });

    return { ok: true };
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: { id: string }) {
    if (!user?.id) {
      throw new UnauthorizedException('User session is required');
    }

    return this.authService.logoutAll(user.id);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getCurrentUser(user.id);
  }
}
