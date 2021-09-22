import { MetaInternalResult } from '@metaio/microservice-model';
import { MetaWorker } from '@metaio/worker-model';
import {
  Inject,
  Injectable,
  LoggerService,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';

import { MetaMicroserviceClient } from '../../../constants';
import { DataNotFoundException } from '../../../exceptions';
import { GitHubStorageLogicService } from './github/logicService';

type GenerateMetaWorkerGitInfo = {
  gitInfo: MetaWorker.Info.Git;
  repoSize: number;
};

@Injectable()
export class StorageService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(MetaMicroserviceClient.UCenter)
    private readonly ucenterClient: ClientProxy,
    private readonly githubService: GitHubStorageLogicService,
  ) {}

  async generateMetaWorkerGitInfo(
    type: MetaWorker.Enums.StorageType,
    userId: number,
    storageProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    if (type === MetaWorker.Enums.StorageType.GITHUB) {
      this.logger.verbose(`Generate meta worker Git info`, StorageService.name);

      let gitToken = '';
      try {
        this.logger.verbose(
          `Get user GitHub OAuth token from UCenter microservice`,
          StorageService.name,
        );
        const gitTokenFromUCenter = this.ucenterClient.send(
          'getSocialAuthTokenByUserId',
          { userId: userId, platform: 'github' },
        );
        const result = await firstValueFrom(gitTokenFromUCenter);
        const token = new MetaInternalResult(result);
        if (!token.isSuccess()) {
          this.logger.error(
            `User GitHub OAuth token not found: ${token.message}, code: ${token.code}`,
            StorageService.name,
          );
          throw new DataNotFoundException('user GitHub OAuth token not found');
        }
        gitToken = token.data;
      } catch (err) {
        this.logger.error(
          err,
          `Get user GitHub OAuth token error:`,
          StorageService.name,
        );
        throw new DataNotFoundException('user GitHub OAuth token not found');
      }

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

  async onApplicationBootstrap() {
    await this.ucenterClient.connect();
    this.logger.verbose(
      `Connect UCenter microservice client`,
      StorageService.name,
    );
  }
}
