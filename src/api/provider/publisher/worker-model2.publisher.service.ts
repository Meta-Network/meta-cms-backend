import { MetaWorker } from '@metaio/worker-model2';
import { Injectable } from '@nestjs/common';

import { GiteePublisherProviderEntity } from '../../../entities/provider/publisher/gitee.entity';
import { GitHubPublisherProviderEntity } from '../../../entities/provider/publisher/github.entity';
import { WorkerModel2GitInfo } from '../../../types/worker-model2';
import { getSpecificPublisherService } from './publisher.service';

@Injectable()
export class WorkerModel2PublisherService {
  public async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.PublisherType,
    userId: number,
    storageProviderId: number,
  ): Promise<WorkerModel2GitInfo> {
    const service = getSpecificPublisherService(type);
    const workerModel1GitInfo = await service.generateMetaWorkerGitInfo(
      userId,
      storageProviderId,
    );
    const { gitInfo } = workerModel1GitInfo;
    const branchname = gitInfo.branchName;
    delete gitInfo.branchName;
    return {
      gitInfo: {
        ...gitInfo,
        branchname,
      },
      publishInfo: workerModel1GitInfo.publishInfo,
      repoEmpty: workerModel1GitInfo.repoEmpty,
    };
  }
  public async getPublisherConfig(
    publisherType: MetaWorker.Enums.PublisherType,
    publisherProviderId: number,
  ): Promise<GitHubPublisherProviderEntity | GiteePublisherProviderEntity> {
    const service = getSpecificPublisherService(publisherType);
    return await service.getPublisherConfigById(publisherProviderId);
  }
}
