import { Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { MetadataStorageType } from '../../../types/enum';
import { getMetadataStorageProvider } from './metadata-storage.provider';

export class MetadataStorageService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}
  async get(metadataStorageType: MetadataStorageType, refer: string) {
    return await getMetadataStorageProvider(metadataStorageType).get(refer);
  }
  async upload(
    metadataStorageType: MetadataStorageType,
    contentKey: string,
    content: string,
  ) {
    return await getMetadataStorageProvider(metadataStorageType).upload(
      contentKey,
      content,
    );
  }
}
