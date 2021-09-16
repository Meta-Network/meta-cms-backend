import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessTokenEntity } from '../../entities/accessToken.entity';
import { PostEntity } from '../../entities/post.entity';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, AccessTokenEntity])],
  controllers: [PostController],
  providers: [PostService, AccessTokenService],
})
export class PostModule {}
