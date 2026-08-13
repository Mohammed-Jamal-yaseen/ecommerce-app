import { registerAs } from '@nestjs/config';

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getPositiveNumber = (name: string, fallback?: number): number => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === '') {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Missing required environment variable: ${name}`);
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number.`);
  }

  return parsed;
};

export default registerAs('auth', () => {
  return {
    jwtSecret: requireEnv('JWT_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessTokenTtlSeconds: getPositiveNumber('JWT_EXPIRATION_TIME', 60 * 15),
    refreshTokenTtlSeconds: getPositiveNumber(
      'JWT_REFRESH_EXPIRATION_TIME',
      7 * 24 * 60 * 60,
    ),
    issuer: process.env.JWT_ISSUER ?? 'ecommerce-api',
    audience: process.env.JWT_AUDIENCE ?? 'ecommerce-api',
  };
});
