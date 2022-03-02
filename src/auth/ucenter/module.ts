import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UCenterJwtConfigService } from '../../configs/jwt/ucenter';
import { UCenterAuthenticationService } from './service';
import { UCenterJwtStrategy } from './strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useClass: UCenterJwtConfigService,
    }),
  ],
  providers: [UCenterAuthenticationService, UCenterJwtStrategy],
  exports: [UCenterAuthenticationService],
})
export class UCenterAuthenticationModule {}
