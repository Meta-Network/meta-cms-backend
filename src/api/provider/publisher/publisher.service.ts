import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';

import { GiteePublisherProviderEntity } from '../../../entities/provider/publisher/gitee.entity';
import { GitHubPublisherProviderEntity } from '../../../entities/provider/publisher/github.entity';
import { ValidationException } from '../../../exceptions';
import { GenerateMetaWorkerGitInfo } from '../../../types';
import { getPublisherProvider } from './publisher.provider';

const publisherServiceMap = {};
export function registerSpecificPublisherService(
  publisherType: MetaWorker.Enums.PublisherType,
  publisherProvider: SpecificPublisherService,
) {
  publisherServiceMap[publisherType] = publisherProvider;
  console.log(`Register publisher service: ${publisherType}`);
}

export function getSpecificPublisherService(
  publisherType: MetaWorker.Enums.PublisherType,
): SpecificPublisherService {
  // console.log(publisherType, publisherServiceMap);
  const instance = publisherServiceMap[publisherType];
  if (!instance) {
    throw new ValidationException('Invalid publisher type');
  }
  return instance;
}

export interface SpecificPublisherService {
  generateMetaWorkerGitInfo(
    userId: number,
    publisherProviderId: number,
  ): GenerateMetaWorkerGitInfo | Promise<GenerateMetaWorkerGitInfo>;
  getPublisherConfigById(
    sid: number,
  ): Promise<GitHubPublisherProviderEntity | GiteePublisherProviderEntity>;
}

@Injectable()
export class PublisherService {
  getTargetOriginDomain(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    const provider = getPublisherProvider(publisherType);
    return provider.getTargetOriginDomain(publishConfig);
  }

  public getTargetOriginDomainByEntity(
    publisherType: MetaWorker.Enums.PublisherType,
    entity: GitHubPublisherProviderEntity | GiteePublisherProviderEntity,
  ): string {
    const provider = getPublisherProvider(publisherType);
    return provider.getTargetOriginDomainByEntity(entity);
  }

  async updateDomainName(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    const provider = getPublisherProvider(publisherType);
    await provider.updateDomainName(publishConfig);
  }

  async generateMetaWorkerGitInfo(
    publisherType: MetaWorker.Enums.PublisherType,
    userId: number,
    publisherProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    const service = getSpecificPublisherService(publisherType);
    return await service.generateMetaWorkerGitInfo(userId, publisherProviderId);
  }

  public async getPublisherConfig(
    publisherType: MetaWorker.Enums.PublisherType,
    publisherProviderId: number,
  ): Promise<GitHubPublisherProviderEntity | GiteePublisherProviderEntity> {
    const service = getSpecificPublisherService(publisherType);
    return await service.getPublisherConfigById(publisherProviderId);
  }
}
