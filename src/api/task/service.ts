import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { BullProcessorType } from '../../constants';
import { DataNotFoundException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { StorageService } from '../provider/storage/service';
import { SiteService } from '../site/service';
import { GitWorkerTaskService } from './git/service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly siteService: SiteService,
    private readonly storageService: StorageService,
    private readonly gitWorkerService: GitWorkerTaskService,
  ) {}

  async deploySiteFromConfig(
    user: UCenterJWTPayload,
    cid: number,
  ): Promise<void> {
    this.logger.verbose(`Generate meta worker user info`, TasksService.name);
    const userInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

    const { siteInfo, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user.id, cid);

    const { sId, sType } = storage;
    if (!sId) throw new DataNotFoundException('storage provider id not found');
    const { gitInfo, repoSize } =
      await this.storageService.generateMetaWorkerGitInfo(sType, user.id, sId);

    const workerConfig: MetaWorker.Configs.GitHubWorkerConfig = {
      ...userInfo,
      ...siteInfo,
      ...gitInfo,
    };

    this.logger.verbose(`Adding storage worker to queue`, TasksService.name);
    if (repoSize > 0) {
      this.logger.verbose(
        `GitHub repo size is ${repoSize}, skip add storage worker`,
        TasksService.name,
      );
    } else {
      await this.gitWorkerService.addGitWorkerQueue(
        BullProcessorType.CREATE_SITE,
        workerConfig,
      );
    }

    this.logger.verbose(`Adding CICD worker to queue`, TasksService.name);

    this.logger.verbose(`Adding publisher worker to queue`, TasksService.name);

    this.logger.verbose(`Adding CDN worker to queue`, TasksService.name);

    // TODO: How to sync all worker
    // TODO: Response deploy status
  }
}
