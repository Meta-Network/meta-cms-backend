import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessTokenEntity } from '../../entities/accessToken.entity';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import { TokenController } from './token.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessTokenEntity])],
  controllers: [TokenController],
  providers: [AccessTokenService],
})
export class TokenModule {}
