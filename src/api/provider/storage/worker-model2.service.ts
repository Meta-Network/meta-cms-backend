import { MetaWorker } from '@metaio/worker-model2';
import { Injectable } from '@nestjs/common';

import { getSpecificStorageService } from './service';

@Injectable()
export class WorkerModel2StorageService {
  public async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<any> {
    const service = getSpecificStorageService(type);
    return await service.generateMetaWorkerGitInfo(userId, storageProviderId);
  }

  public async getMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<any> {
    const service = getSpecificStorageService(type);
    return await service.getMetaWorkerGitInfo(userId, storageProviderId);
  }
}
