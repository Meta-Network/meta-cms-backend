import * as cookieParser from 'cookie-parser';
import formCors from 'form-cors';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/module';
import { RequestNotAcceptableException } from './exceptions';
import packageJson = require('../package.json');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('app.name'))
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.use(cookieParser());
  app.use(
    formCors({
      exception: new RequestNotAcceptableException(),
    }),
  );
  await app.listen(configService.get<number>('app.port'));
}
bootstrap();
