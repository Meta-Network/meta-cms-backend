import { BaseSignatureMetadata } from '@metaio/meta-signature-util-v2';
import { HttpService } from '@nestjs/axios';
import { Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { lastValueFrom } from 'rxjs';

import { MetadataStorageType } from '../../../../types/enum';
import {
  MetadataStorageProvider,
  registerMetadataStorageProvider,
} from '../metadata-storage.provider';

export class ArweaveMetadataStorageProvider implements MetadataStorageProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    registerMetadataStorageProvider(MetadataStorageType.ARWEAVE, this);

    const host = this.configService.get<string>(
      'provider.metadataStorage.arweave.host',
      'arweave.net',
    );
    const port = this.configService.get<number>(
      'provider.metadataStorage.arweave.port',
      443,
    );
    const protocol = this.configService.get<string>(
      'provider.metadataStorage.arweave.protocol',
      'https',
    );
    const walletKeyPath = this.configService.get<string>(
      'provider.metadataStorage.arweave.walletKeyPath',
    );
    if (!walletKeyPath) {
      throw new Error(
        'Config key provider.metadataStorage.arweave.walletKeyPath: no value',
      );
    }
    const walletKeyData = fs.readFileSync(walletKeyPath, { encoding: 'utf-8' });
    const walletKey = JSON.parse(walletKeyData);

    const arweave = Arweave.init({
      host,
      port,
      protocol,
      // logging: true,
    });

    this.arweave = arweave;
    this.walletKey = walletKey;
  }

  private readonly arweave: Arweave;
  private readonly walletKey: JWKInterface;

  public async get(refer: string): Promise<string> {
    this.logger.debug(
      `Get metadata from Arweave, refer ${refer}`,
      this.constructor.name,
    );
    try {
      const data = await this.arweave.transactions.getData(refer, {
        decode: true,
        string: true,
      });
      return data.toString();
    } catch (error) {
      this.logger.warn(
        `Get metadata ${refer} from arweave failed, ${error}`,
        this.constructor.name,
      );
      // https://arweave.net/P5TcYTsdNw6Qs42xhgtFgE0SaVdOUhlVnDBy3T7kFwY
      const res = this.httpService.get<BaseSignatureMetadata | string>(
        `https://arweave.net/${refer}`,
      );
      const { data } = await lastValueFrom(res);
      if (typeof data === 'object') return JSON.stringify(data);
      return data;
    }
  }

  public async upload(_: string, content: string): Promise<string> {
    const transaction = await this.arweave.createTransaction(
      { data: content },
      this.walletKey,
    );
    transaction.addTag('Content-Type', 'application/json');
    await this.arweave.transactions.sign(transaction, this.walletKey);
    this.logger.debug(transaction, this.constructor.name);

    const uploader = await this.arweave.transactions.getUploader(transaction);
    while (!uploader.isComplete) {
      this.logger.debug(`Arweave uploadChunk.`, this.constructor.name);
      await uploader.uploadChunk();
    }
    this.logger.debug(
      `Upload metadata to Arweave, chunk ${uploader.uploadedChunks}`,
      this.constructor.name,
    );
    // TODO(550): How to confirm tx is mined.
    // const status = await this.arweave.transactions.getStatus(transaction.id);
    // if (status.status !== 200) {
    //   throw new Error(`Arweave submit transaction faild.`);
    // }
    return transaction.id;
  }
}
