import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { ValidationPipe, Logger, ClassSerializerInterceptor } from "@nestjs/common"

async function bootstrap() {
  const logger = new Logger("Bootstrap")

  try {
    const app = await NestFactory.create(AppModule)

    const port = process.env.PORT ?? 3001

    const config = new DocumentBuilder()
      .setTitle("Complimentary Travel Insurance API: Documentation")
      .setDescription("Api is setup for Complimentary Travel Insurance")
      .addServer("")
      .build()


    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup("api", app, document)

    app.enableCors({
      origin: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

    await app.listen(port)
    logger.log(`Application is running on: http://localhost:${port}`)
    logger.log(`Swagger documentation available at: http://localhost:${port}/api`)
  } catch (error) {
    logger.error("Error starting application:", error)
    process.exit(1)
  }
}
bootstrap()