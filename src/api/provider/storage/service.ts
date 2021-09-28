import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { GenerateMetaWorkerGitInfo } from '../../../types';
import { MetaUCenterService } from '../../microservices/meta-ucenter/meta-ucenter.service';
import { GitHubStorageLogicService } from './github/logicService';

@Injectable()
export class StorageService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,

    private readonly ucenterService: MetaUCenterService,
    private readonly githubService: GitHubStorageLogicService,
  ) {}

  async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    if (type === MetaWorker.Enums.StorageType.GITHUB) {
      this.logger.verbose(`Generate meta worker Git info`, StorageService.name);

      const gitToken = await this.ucenterService.getGitHubAuthTokenByUserId(
        userId,
      );

      this.logger.verbose(
        `Get storage config from GitHubStorageLogicService`,
        StorageService.name,
      );
      const github = await this.githubService.getStorageConfigById(
        storageProviderId,
      );

      this.logger.verbose(
        `Create GitHub repo from config`,
        StorageService.name,
      );
      const { status, size } =
        await this.githubService.createGitHubRepoFromConfig(gitToken, github);
      if (!status) {
        this.logger.error(
          `Create GitHub repo from config failed`,
          StorageService.name,
        );
      }

      const { userName, repoName, branchName, lastCommitHash } = github;
      const gitInfo: MetaWorker.Info.Git = {
        gitToken,
        gitType: MetaWorker.Enums.GitServiceType.GITHUB,
        gitUsername: userName,
        gitReponame: repoName,
        gitBranchName: branchName,
        gitLastCommitHash: lastCommitHash,
      };

      return { gitInfo, repoSize: size };
    }
  }
}
