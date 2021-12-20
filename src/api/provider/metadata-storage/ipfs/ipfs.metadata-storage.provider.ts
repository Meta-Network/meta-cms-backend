import fleekStorage from '@fleekhq/fleek-storage-js';
import { Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import superagent from 'superagent';

import { MetadataStorageType } from '../../../../types/enum';
import {
  MetadataStorageProvider,
  registerMetadataStorageProvider,
} from '../metadata-storage.provider';

export class IpfsMetadataStorageProvider implements MetadataStorageProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    registerMetadataStorageProvider(MetadataStorageType.IPFS, this);
  }

  public async get(refer: string): Promise<string> {
    const gateways = this.configService.get<string[]>(
      'provider.metadataStorage.ipfs.gateways',
    );
    const gateway = gateways[Math.floor(Math.random() * gateways.length)];
    this.logger.debug(
      `Get metadata from IPFS Gateway: ${gateway}`,
      this.constructor.name,
    );
    const res = await superagent.get(`${gateway}/ipfs/${refer}`);
    return JSON.stringify(res.body);
  }

  public async upload(contentKey: string, content: string): Promise<string> {
    const folder = this.configService.get<string>(
      'provider.metadataStorage.ipfs.fleek.folder',
    );
    const uploadedFile = await fleekStorage.upload({
      apiKey: this.configService.get<string>(
        'provider.metadataStorage.ipfs.fleek.apiKey',
      ),
      apiSecret: this.configService.get<string>(
        'provider.metadataStorage.ipfs.fleek.apiSecret',
      ),
      key: `${folder}/${contentKey}`,
      data: content,
    });
    this.logger.debug(
      `Upload metadata to IPFS ${JSON.stringify(uploadedFile)}`,
      this.constructor.name,
    );
    return uploadedFile.hash;
  }
}
