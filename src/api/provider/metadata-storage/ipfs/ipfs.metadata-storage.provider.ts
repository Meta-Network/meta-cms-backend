import fleekStorage from '@fleekhq/fleek-storage-js';
import { BaseSignatureMetadata } from '@metaio/meta-signature-util-v2';
import { HttpService } from '@nestjs/axios';
import { Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { Contract } from 'ethers';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { lastValueFrom } from 'rxjs';

import { MetadataStorageType } from '../../../../types/enum';
// import * as InjectToken from '../inject-token';
import {
  MetadataStorageProvider,
  registerMetadataStorageProvider,
} from '../metadata-storage.provider';

export class IpfsMetadataStorageProvider implements MetadataStorageProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // @Inject(InjectToken.Contract) // private readonly mappingContract: Contract,
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
    const res = this.httpService.get<BaseSignatureMetadata | string>(
      `${gateway}/ipfs/${refer}`,
    );
    const { data } = await lastValueFrom(res);
    if (typeof data === 'object') return JSON.stringify(data);
    return data;
  }

  public async upload(contentKey: string, content: string): Promise<string> {
    try {
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
      this.logger.verbose(
        `Upload metadata to IPFS, content ${JSON.stringify(uploadedFile)}`,
        this.constructor.name,
      );

      // try {
      //   const transaction = await this.mappingContract.mint(uploadedFile.hash);

      //   this.logger.verbose(
      //     `Transaction ${transaction.hash} submitted`,
      //     this.constructor.name,
      //   );
      // } catch (error) {
      //   this.logger.error(
      //     `Failed to call mapping contract`,
      //     error,
      //     this.constructor.name,
      //   );
      // }

      return uploadedFile.hash;
    } catch (error) {
      // Try to catch socket hang up error.
      throw error;
    }
  }
}
