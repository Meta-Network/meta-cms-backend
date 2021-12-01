import { Module } from '@nestjs/common';

import { ArweaveMetadataStorageProvider } from './arweave/arweave.metadata-storage.provider';
import { IpfsMetadataStorageProvider } from './ipfs/ipfs.metadata-storage.provider';
import { MetadataStorageService } from './metadata-storage.service';

@Module({
  providers: [
    IpfsMetadataStorageProvider,
    ArweaveMetadataStorageProvider,
    MetadataStorageService,
  ],
  exports: [MetadataStorageService],
})
export class MetadataStorageModule {}
