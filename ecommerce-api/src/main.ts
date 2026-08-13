import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const preferredPort = Number(process.env.PORT ?? 3000);

  try {
    await app.listen(preferredPort);
    Logger.log(`Application is running on port ${preferredPort}`);
  } catch (error) {
    Logger.error('Error starting the application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  Logger.error('Error starting the application:', error);
  process.exit(1);
});
