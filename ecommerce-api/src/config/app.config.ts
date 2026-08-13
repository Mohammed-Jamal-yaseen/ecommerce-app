import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  globalPrefix: process.env.API_PREFIX ?? 'api',
}));
