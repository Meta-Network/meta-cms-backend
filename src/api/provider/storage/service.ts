import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';

import { ValidationException } from '../../../exceptions';
import { GenerateMetaWorkerGitInfo } from '../../../types';

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
}

@Injectable()
export class StorageService {
  async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    const service = getSpecificStorageService(type);
    return await service.generateMetaWorkerGitInfo(userId, storageProviderId);
  }

  async getMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    const service = getSpecificStorageService(type);
    return await service.getMetaWorkerGitInfo(userId, storageProviderId);
  }
}
