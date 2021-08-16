import * as cookieParser from 'cookie-parser';
import formCors from 'form-cors';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app/module';
import { RequestNotAcceptableException } from 'src/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('app.name'))
    .setDescription('CMS API testing branch')
    .setVersion(process.env.npm_package_version || '0.0.1')
    .addCookieAuth('ucenter_access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    customCss: '.swagger-ui tr { display: block; padding: 10px 0; }',
  });

  app.use(cookieParser());
  app.use(
    formCors({
      exception: new RequestNotAcceptableException(),
    }),
  );
  await app.listen(configService.get<number>('app.port'));
}
bootstrap();
