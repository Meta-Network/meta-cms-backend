import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import pRetry from 'p-retry';

import { MetadataStorageType } from '../../../types/enum';
import { getMetadataStorageProvider } from './metadata-storage.provider';

@Injectable()
export class MetadataStorageService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  public async get(metadataStorageType: MetadataStorageType, refer: string) {
    const provider = getMetadataStorageProvider(metadataStorageType);
    const result = await pRetry(() => provider.get(refer), {
      retries: 5,
      onFailedAttempt: (error) => {
        this.logger.error(
          `Get metadata ${refer} from ${metadataStorageType} failed, ${error}`,
          error,
          this.constructor.name,
        );
        this.logger.debug(
          `Attempt ${error.attemptNumber} failed, there are ${error.retriesLeft} retries left.`,
          this.constructor.name,
        );
      },
    });
    return result;
  }

  public async upload(
    metadataStorageType: MetadataStorageType,
    contentKey: string,
    content: string,
  ) {
    const provider = getMetadataStorageProvider(metadataStorageType);
    const result = await pRetry(() => provider.upload(contentKey, content), {
      retries: 5,
      onFailedAttempt: (error) => {
        this.logger.error(
          `Upload metadata to ${metadataStorageType} failed, ${error}`,
          error,
          this.constructor.name,
        );
        this.logger.debug(
          `Attempt ${error.attemptNumber} failed, there are ${error.retriesLeft} retries left.`,
          this.constructor.name,
        );
      },
    });
    return result;
  }
}
