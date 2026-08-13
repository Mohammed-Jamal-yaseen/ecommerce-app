import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SecurityModule } from '../../lib/security/security.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './sessions/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SecurityModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, JwtStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
