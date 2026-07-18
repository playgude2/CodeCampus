import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Raw body is needed by the Stripe webhook (Phase 3).
    rawBody: true,
    bufferLogs: false,
  });

  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<AppConfig>('app');
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix(appCfg.apiPrefix);
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: appCfg.corsOrigins.length ? appCfg.corsOrigins : true,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CodeCampus API')
    .setDescription('LeetCode-style coding-education platform')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(appCfg.port);
  logger.log(`CodeCampus API listening on :${appCfg.port}/${appCfg.apiPrefix}`);
  logger.log(`Swagger docs at :${appCfg.port}/api/docs`);
}

void bootstrap();
