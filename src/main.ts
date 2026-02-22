import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('API')
    .setVersion('dev')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  await app.listen(configService.get<number>('port') ?? 3000);
}
bootstrap();
