import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  arcjetEnabled: process.env.ARCJET_ENABLED === 'true',
  arcjetKey: process.env.ARCJET_KEY ?? '',
  arcjetEnv: process.env.ARCJET_ENV ?? 'development',
}));
