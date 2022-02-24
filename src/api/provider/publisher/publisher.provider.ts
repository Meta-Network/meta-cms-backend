import { MetaWorker } from '@metaio/worker-model';
import { Logger } from '@nestjs/common';

import { GitPublisherProviderEntity } from '../../../entities/provider/publisher/git.entity';
import { ValidationException } from '../../../exceptions';

const publisherProviderMap = {};
export function registerPublisherProvider(
  publisherType: MetaWorker.Enums.PublisherType,
  publisherProvider: PublisherProvider,
) {
  publisherProviderMap[publisherType] = publisherProvider;
  const logger = new Logger('PublisherProvider');
  logger.log(`Register publisher provider: ${publisherType}`);
}

export function getPublisherProvider(
  publisherType: MetaWorker.Enums.PublisherType,
): PublisherProvider {
  // console.log(publisherType, publisherProviderMap);

  const instance = publisherProviderMap[publisherType];
  if (!instance) {
    throw new ValidationException('Invalid publisher type');
  }
  return instance;
}

export interface PublisherProvider {
  getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string;
  getTargetOriginDomainByPublisherConfig(
    config: GitPublisherProviderEntity,
  ): string;
  updateDomainName(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): void | Promise<void>;
}
