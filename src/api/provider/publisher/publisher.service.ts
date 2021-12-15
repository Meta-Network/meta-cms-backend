import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';

import { GiteePublisherProviderEntity } from '../../../entities/provider/publisher/gitee.entity';
import { GitHubPublisherProviderEntity } from '../../../entities/provider/publisher/github.entity';
import { ValidationException } from '../../../exceptions';
import { GenerateMetaWorkerGitInfo, GitTreeInfo } from '../../../types';
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
  getGitTreeList(info: MetaWorker.Info.Git): Promise<GitTreeInfo[]>;
}

@Injectable()
export class PublisherService {
  public getTargetOriginDomain(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    const provider = getPublisherProvider(publisherType);
    return provider.getTargetOriginDomain(publishConfig);
  }

  public getTargetOriginDomainByPublisherConfig(
    publisherType: MetaWorker.Enums.PublisherType,
    config: GitHubPublisherProviderEntity | GiteePublisherProviderEntity,
  ): string {
    const provider = getPublisherProvider(publisherType);
    return provider.getTargetOriginDomainByPublisherConfig(config);
  }

  public async updateDomainName(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    const provider = getPublisherProvider(publisherType);
    await provider.updateDomainName(publishConfig);
  }

  public async generateMetaWorkerGitInfo(
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

  public async getGitTreeList(
    publisherType: MetaWorker.Enums.PublisherType,
    info: MetaWorker.Info.Git,
    findPath?: string,
    type?: 'tree' | 'blob',
  ): Promise<GitTreeInfo[]> {
    const service = getSpecificPublisherService(publisherType);
    const treeList = await service.getGitTreeList(info);
    if (findPath && type) {
      const filterByBoth = treeList.filter(
        (tree) => tree.path.includes(findPath) && tree.type === type,
      );
      return filterByBoth;
    }
    if (findPath && !type) {
      const filterByPath = treeList.filter((tree) =>
        tree.path.includes(findPath),
      );
      return filterByPath;
    }
    if (!findPath && type) {
      const filterByType = treeList.filter((tree) => tree.type === type);
      return filterByType;
    }
  }
}
