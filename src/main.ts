import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    const port = process.env.PORT ?? 3001;
    const env = process.env.NODE_ENV || 'development';

    app.setGlobalPrefix('api/v1');

    // In development: allow all origins
    // In production: restrict to the frontend domain via ALLOWED_ORIGINS env var
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : [];

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        if (env === 'development') {
          // Allow all origins in development
          return callback(null, true);
        }

        // Production: only allow listed origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        logger.warn(`CORS blocked request from origin: ${origin}`);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
      maxAge: 86400, // preflight cache: 24 hours
    });

    app.useGlobalFilters(new GlobalExceptionFilter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Complimentary Travel Insurance API')
      .setDescription('API for the Leadway Complimentary Travel Insurance Portal')
      .setVersion('1.0')
      .addServer('')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(port);
    logger.log(`Environment: ${env}`);
    logger.log(`Application running on: http://localhost:${port}`);
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
    logger.log(`Endpoint: POST http://localhost:${port}/api/v1/registrations`);
  } catch (error) {
    logger.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();