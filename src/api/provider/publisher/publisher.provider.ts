import { MetaWorker } from '@metaio/worker-model';

import { GitPublisherProviderEntity } from '../../../entities/provider/publisher/git.entity';
import { ValidationException } from '../../../exceptions';
import { GitTreeInfo } from '../../../types';

const publisherProviderMap = {};
export function registerPublisherProvider(
  publisherType: MetaWorker.Enums.PublisherType,
  publisherProvider: PublisherProvider,
) {
  publisherProviderMap[publisherType] = publisherProvider;
  console.log(`Register publisher provider: ${publisherType}`);
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
  getGitTreeList(info: MetaWorker.Info.Git): Promise<GitTreeInfo[]>;
  updateDomainName(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): void | Promise<void>;
}
