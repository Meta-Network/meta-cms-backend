import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { BullProcessorType, BullQueueType } from '../../../constants';
import { GitHubStorageProviderEntity } from '../../../entities/provider/storage/github.entity';
import { UCenterJWTPayload } from '../../../types';
import { GitServiceType, TaskMethod } from '../../../types/enum';
import {
  CMSSiteConfig,
  CMSSiteInfo,
  GitInfo,
  TaskConfig,
  TaskInfo,
  TemplateInfo,
  UCenterUserInfo,
} from '../../../types/worker';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { TemplateLogicService } from '../../theme/template/logicService';

@Injectable()
export class GitWorkerTasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue(BullQueueType.WORKER_GIT)
    private readonly gitQueue: Queue<TaskConfig>,
    private readonly siteConfigService: SiteConfigLogicService,
    private readonly templateService: TemplateLogicService,
  ) {}

  private async addTaskQueue(type: BullProcessorType, cfg: TaskConfig) {
    const job = await this.gitQueue.add(type, cfg, { jobId: cfg.taskId });
    this.logger.verbose(
      `Successfully add task queue, taskId: ${job.data.taskId}`,
      GitWorkerTasksService.name,
    );
  }

  // @Interval(30000)
  // protected async processTaskQueue(): Promise<void> {
  //   const _waiting = await this.gitQueue.getJobs(['waiting']);
  //   this.logger.verbose(
  //     `Current have ${_waiting.length} waiting jobs`,
  //     GitWorkerTasksService.name,
  //   );
  // }

  async addGitWorkerQueue(
    type: BullProcessorType,
    configId: number,
    user: UCenterJWTPayload,
    provider: GitHubStorageProviderEntity,
  ): Promise<void> {
    const { userName, repoName, branchName, lastCommitHash } = provider;
    const taskGitInfo: GitInfo = {
      gitToken: 'gho_', // TODO: change!
      gitType: GitServiceType.GITHUB,
      gitUsername: userName,
      gitReponame: repoName,
      gitBranchName: branchName,
      gitLastCommitHash: lastCommitHash,
    };

    const config = await this.siteConfigService.getSiteConfigById(configId);
    const { language, timezone, domain, templateId } = config;
    const taskSiteConfig: CMSSiteConfig = {
      configId,
      language,
      timezone,
      domain,
    };

    const { title, subtitle, description, author, keywords, favicon } =
      config.siteInfo;
    const taskSiteInfo: CMSSiteInfo = {
      title,
      subtitle,
      description,
      author,
      keywords,
      favicon,
    };

    const template = await this.templateService.getTemplateById(templateId);
    const {
      templateName,
      repoUrl,
      branchName: templateBranchName,
      templateType,
    } = template;
    const taskTemplateInfo: TemplateInfo = {
      templateName,
      templateRepoUrl: repoUrl,
      templateBranchName,
      templateType,
    };

    const taskUserInfo: UCenterUserInfo = {
      username: user.username,
      nickname: user.nickname,
    };

    const taskMethod: TaskMethod =
      type === BullProcessorType.CREATE_SITE
        ? TaskMethod.CREATE_REPO_FROM_TEMPLATE
        : TaskMethod.CREATE_REPO_FROM_TEMPLATE;
    const taskInfo: TaskInfo = {
      taskId: uuid(),
      taskMethod,
    };
    const taskConfig: TaskConfig = {
      ...taskInfo,
      ...taskUserInfo,
      ...taskTemplateInfo,
      ...taskSiteInfo,
      ...taskSiteConfig,
      ...taskGitInfo,
    };

    this.logger.verbose(
      `[addGitWorkerQueue] Add git worker queue task ${taskConfig.taskId} method ${taskConfig.taskMethod}`,
      GitWorkerTasksService.name,
    );
    await this.addTaskQueue(type, taskConfig);
  }
}
