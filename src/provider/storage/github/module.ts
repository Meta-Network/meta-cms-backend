import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitHubStorageProviderEntity } from '../../../entities/provider/storage/github.entity';
import { GitHubStorageBaseService } from './baseService';
import { GitHubStorageController } from './controller';

@Module({
  imports: [TypeOrmModule.forFeature([GitHubStorageProviderEntity])],
  controllers: [GitHubStorageController],
  providers: [GitHubStorageBaseService],
  exports: [GitHubStorageBaseService],
})
export class GitHubStorageModule {}
