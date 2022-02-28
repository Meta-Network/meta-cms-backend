import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UCenterJwtConfigService } from '../../configs/jwt/ucenter';
import { UCenterAuthorizeService } from './service';
import { UCenterJwtStrategy } from './strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useClass: UCenterJwtConfigService,
    }),
  ],
  providers: [UCenterAuthorizeService, UCenterJwtStrategy],
  exports: [UCenterAuthorizeService],
})
export class UCenterAuthorizeModule {}
