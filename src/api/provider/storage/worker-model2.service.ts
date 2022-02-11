import { MetaWorker } from '@metaio/worker-model2';
import { Injectable } from '@nestjs/common';

import { GenerateMetaWorkerGitInfo } from '../../../types';
import { WorkerModel2GitInfo } from '../../../types/worker-model2';
import { getSpecificStorageService } from './service';

@Injectable()
export class WorkerModel2StorageService {
  public async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<WorkerModel2GitInfo> {
    const service = getSpecificStorageService(type);
    const workerModel1GitInfo = await service.generateMetaWorkerGitInfo(
      userId,
      storageProviderId,
    );

    return this.model1tomodel2(workerModel1GitInfo);
  }

  private model1tomodel2(workerModel1GitInfo: GenerateMetaWorkerGitInfo) {
    const { gitInfo } = workerModel1GitInfo;
    const branchname = gitInfo.branchName;
    delete gitInfo.branchName;
    return {
      gitInfo: {
        ...gitInfo,
        branchname,
      },

      repoEmpty: workerModel1GitInfo.repoEmpty,
    };
  }

  public async getMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<WorkerModel2GitInfo> {
    const service = getSpecificStorageService(type);
    const workerModel1GitInfo = await service.getMetaWorkerGitInfo(
      userId,
      storageProviderId,
    );
    return this.model1tomodel2(workerModel1GitInfo);
  }
}
