import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';

import { ValidationException } from '../../../exceptions';
import { GenerateMetaWorkerGitInfo, GitTreeInfo } from '../../../types';

const storageServiceMap = {};
export function registerSpecificStorageService(
  type: MetaWorker.Enums.StorageType,
  provider: SpecificStorageService,
) {
  storageServiceMap[type] = provider;
  console.log(`Register storage service: ${type}`);
}

export function getSpecificStorageService(
  type: MetaWorker.Enums.StorageType,
): SpecificStorageService {
  // console.log(publisherType, publisherServiceMap);
  const instance = storageServiceMap[type];
  if (!instance) {
    throw new ValidationException('Invalid storage type');
  }
  return instance;
}

export interface SpecificStorageService {
  generateMetaWorkerGitInfo(
    userId: number,
    providerId: number,
  ): GenerateMetaWorkerGitInfo | Promise<GenerateMetaWorkerGitInfo>;

  getMetaWorkerGitInfo(
    userId: number,
    providerId: number,
  ): GenerateMetaWorkerGitInfo | Promise<GenerateMetaWorkerGitInfo>;

  getGitTreeList(info: MetaWorker.Info.Git): Promise<GitTreeInfo[]>;
}

@Injectable()
export class StorageService {
  public async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    const service = getSpecificStorageService(type);
    return await service.generateMetaWorkerGitInfo(userId, storageProviderId);
  }

  public async getMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    const service = getSpecificStorageService(type);
    return await service.getMetaWorkerGitInfo(userId, storageProviderId);
  }

  public async getGitTreeList(
    type: MetaWorker.Enums.StorageType,
    info: MetaWorker.Info.Git,
    findPath?: string,
    findType?: 'tree' | 'blob',
  ): Promise<GitTreeInfo[]> {
    const service = getSpecificStorageService(type);
    const treeList = await service.getGitTreeList(info);
    if (findPath && findType) {
      const filterByBoth = treeList.filter(
        (tree) => tree.path.includes(findPath) && tree.type === findType,
      );
      return filterByBoth;
    }
    if (findPath && !findType) {
      const filterByPath = treeList.filter((tree) =>
        tree.path.includes(findPath),
      );
      return filterByPath;
    }
    if (!findPath && findType) {
      const filterByType = treeList.filter((tree) => tree.type === findType);
      return filterByType;
    }
  }
}
