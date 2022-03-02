import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CMSJwtConfigService } from '../../configs/jwt/cms';
import { CMSAuthenticationService } from './service';
import { CMSJwtStrategy } from './strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useClass: CMSJwtConfigService,
    }),
  ],
  providers: [CMSAuthenticationService, CMSJwtStrategy],
  exports: [CMSAuthenticationService],
})
export class CMSAuthenticationModule {}
