import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logLevels = (process.env.LOG_LEVEL?.split(',') as any) || [
    'log',
    'error',
    'warn',
    'debug',
    'verbose',
  ];
  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  const config = new DocumentBuilder()
    .setTitle('Threat Insight API')
    .setDescription('Threat Insight 프로젝트의 API 문서입니다.')
    .setVersion('1.0')
    .addTag('CVE')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
