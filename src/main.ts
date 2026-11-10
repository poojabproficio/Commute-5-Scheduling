
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate incoming request data
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Allow requests from the Angular frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://192.168.0.8:4200',
    ],
    credentials: true,
  });

  // Start Scheduling backend on port 3001
  await app.listen(process.env.PORT || 3001, '0.0.0.0');

  console.log(`Scheduling backend running on port ${process.env.PORT || 3001}`);
}

await bootstrap();
