import { MetaWorker } from '@metaio/worker-model';

import { ValidationException } from '../../../../../exceptions';

const publisherProviderMap = {};
export function registerPublisherProvider(
  publisherType: MetaWorker.Enums.PublisherType,
  publisherProvider,
) {
  publisherProviderMap[publisherType] = publisherProvider;
}
export function getPublisherProvider(
  publisherType: MetaWorker.Enums.PublisherType,
): PublisherProvider {
  console.log(publisherType, publisherProviderMap);
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
  updateDomainName(publishConfig: MetaWorker.Configs.PublishConfig);
}
