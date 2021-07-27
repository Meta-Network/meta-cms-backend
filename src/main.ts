import * as cookieParser from 'cookie-parser';
import * as formCors from 'form-cors';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/module';
import { RequestNotAcceptableException } from './exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    formCors({
      exception: new RequestNotAcceptableException(),
    }),
  );
  await app.listen(3000);
}
bootstrap();
