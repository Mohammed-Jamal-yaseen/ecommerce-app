import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ArcjetGuard } from './arcjet/arcjet.guard';
import { ArcjetService } from './arcjet/arcjet.service';
import { PasswordHasherService } from './hashing/password-hasher.service';
import { TokenHasherService } from './hashing/token-hasher.service';
import { JwtService } from './jwt/jwt.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.getOrThrow<{
          jwtSecret: string;
          accessTokenTtlSeconds: number;
        }>('auth');

        return {
          secret: authConfig.jwtSecret,
          signOptions: {
            expiresIn: authConfig.accessTokenTtlSeconds,
          },
        };
      },
    }),
  ],
  providers: [
    PasswordHasherService,
    TokenHasherService,
    JwtService,
    ArcjetService,
    ArcjetGuard,
  ],
  exports: [
    JwtModule,
    PasswordHasherService,
    TokenHasherService,
    JwtService,
    ArcjetService,
    ArcjetGuard,
  ],
})
export class SecurityModule {}
