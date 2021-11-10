import { Module } from '@nestjs/common';

import { IpfsMetadataStorageProvider } from './ipfs/ipfs.metadata-storage.provider';
import { MetadataStorageService } from './metadata-storage.service';

@Module({
  providers: [IpfsMetadataStorageProvider, MetadataStorageService],
  exports: [MetadataStorageService],
})
export class MetadataStorageModule {}
