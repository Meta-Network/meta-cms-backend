import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, NatsOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import formCors from 'form-cors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './api/app/module';
import { RequestNotAcceptableException } from './exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const appPort = +configService.get<number>('app.port', 3000);
  const enableSwagger = configService.get<boolean>('swagger.enable');
  const msServerConfig = configService.get<NatsOptions>('microservice.server');
  const cookieName = configService.get<string>('jwt.cookieName');

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('app.name'))
      .setDescription('CMS API testing branch')
      .setVersion(process.env.npm_package_version || '0.0.1')
      .addCookieAuth(cookieName)
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document, {
      customCss: '.swagger-ui tr { display: block; padding: 10px 0; }',
    });
  }

  app.enableCors();
  app.use(cookieParser());
  app.use(
    formCors({
      exception: new RequestNotAcceptableException(),
    }),
  );
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.connectMicroservice<MicroserviceOptions>(msServerConfig);

  await app.startAllMicroservices();
  await app.listen(appPort);
}
bootstrap();
