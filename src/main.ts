import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/module';
import { JWTAuthGuard } from './auth/guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new JWTAuthGuard());
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
