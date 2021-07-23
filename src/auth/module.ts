import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigService } from '../config/jwt';
import { JwtStrategy } from '../auth/strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
