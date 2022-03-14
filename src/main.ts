import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, NatsOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import formCors from 'form-cors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app/module';
import { RequestNotAcceptableException } from './exceptions';
import { assertConfig, isEmptyObj } from './utils';
// import { EntityNotFoundExceptionFilter } from './filters/entity-not-found-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const appPort = +configService.get<number>('app.port', 3000);
  const enableSwagger = configService.get<boolean>('swagger.enable', false);
  const msServerConfig = configService.get<NatsOptions>('microservice.server');
  assertConfig(!isEmptyObj(msServerConfig), 'microservice.server');
  const cookieName = configService.get<string>('jwt.ucenter.cookieName');
  assertConfig(cookieName, 'jwt.ucenter.cookieName');
  const limit = configService.get<string>('app.bodyParser.limit', '50mb');

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('app.name', 'MetaCMS'))
      .setDescription('Meta CMS API')
      .setVersion(process.env.npm_package_version || '0.0.1')
      .addCookieAuth(cookieName)
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document, {
      customCss: '.swagger-ui tr { display: block; padding: 10px 0; }',
    });
  }

  app.enableCors({
    methods: 'POST, PUT, GET, OPTIONS, DELETE, PATCH, HEAD',
    origin: configService.get<string[]>('cors.origins'),
    credentials: true,
  });

  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Methods',
      'POST, PUT, GET, OPTIONS, DELETE, PATCH, HEAD',
    );
    next();
  });

  app.use(bodyParser.json({ limit }));
  app.use(bodyParser.urlencoded({ limit, extended: true }));
  app.use(cookieParser());
  app.use(formCors({ exception: new RequestNotAcceptableException() }));
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.connectMicroservice<MicroserviceOptions>(msServerConfig);
  // app.useGlobalFilters(new EntityNotFoundExceptionFilter());

  await app.startAllMicroservices();
  await app.listen(appPort);
}
bootstrap();
