import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigService } from 'src/configs/jwt';

import { UCenterAuthService } from './service';
import { UCenterJwtStrategy } from './strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useClass: JwtConfigService,
    }),
  ],
  providers: [UCenterAuthService, UCenterJwtStrategy],
  exports: [UCenterAuthService],
})
export class UCenterAuthModule {}
