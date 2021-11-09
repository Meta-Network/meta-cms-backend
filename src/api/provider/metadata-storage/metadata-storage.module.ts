import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { configBuilder } from '../../../configs';
import { WinstonConfigService } from '../../../configs/winston';
import { IpfsMetadataStorageProvider } from './ipfs/ipfs.metadata-storage.provider';
import { MetadataStorageService } from './metadata-storage.service';

@Module({
  providers: [IpfsMetadataStorageProvider, MetadataStorageService],
  exports: [MetadataStorageService],
})
export class MetadataStorageModule {}
