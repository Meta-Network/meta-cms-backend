import { MetaWorker } from '@metaio/worker-model2';
import { Injectable } from '@nestjs/common';

import { GiteePublisherProviderEntity } from '../../../entities/provider/publisher/gitee.entity';
import { GitHubPublisherProviderEntity } from '../../../entities/provider/publisher/github.entity';
import { GenerateMetaWorkerGitInfo } from '../../../types';
import { WorkerModel2GitInfo } from '../../../types/worker-model2';
import { PublisherService } from './publisher.service';

@Injectable()
export class WorkerModel2PublisherService {
  constructor(private readonly publisherService: PublisherService) {}
  public async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.PublisherType,
    userId: number,
    publisherProviderId: number,
  ): Promise<WorkerModel2GitInfo> {
    const workerModel1GitInfo =
      await this.publisherService.generateMetaWorkerGitInfo(
        type,
        userId,
        publisherProviderId,
      );
    return this.generateMetaWorkerGitInfoMddel1ToModel2(workerModel1GitInfo);
  }
  private generateMetaWorkerGitInfoMddel1ToModel2(
    workerModel1GitInfo: GenerateMetaWorkerGitInfo,
  ) {
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
    return await this.publisherService.getPublisherConfig(
      publisherType,
      publisherProviderId,
    );
  }

  public async getTargetOriginDomain(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): Promise<string> {
    return this.publisherService.getTargetOriginDomain(
      publisherType,
      this.publishConfigModel2ToModel1(publishConfig),
    );
  }

  private publishConfigModel2ToModel1(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    const git = publishConfig.git;
    const storageBranchName = git.storage.branchname;
    const publisherBranchName = git.publisher.branchname;
    delete git.storage.branchname;
    delete git.publisher.branchname;
    return {
      site: publishConfig.site,
      git: {
        storage: {
          ...git.storage,
          branchName: storageBranchName,
        },
        publisher: {
          ...git.publisher,
          branchName: publisherBranchName,
        },
      },
      publish: publishConfig?.publish,
    };
  }

  public async updateDomainName(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    return await this.publisherService.updateDomainName(
      publisherType,
      this.publishConfigModel2ToModel1(publishConfig),
    );
  }
}
