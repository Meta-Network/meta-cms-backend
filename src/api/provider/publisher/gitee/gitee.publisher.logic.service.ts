import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeleteResult } from 'typeorm';

import { GiteePublisherProviderEntity } from '../../../../entities/provider/publisher/gitee.entity';
import {
  DataAlreadyExistsException,
  DataNotFoundException,
} from '../../../../exceptions';
import {
  CreateGitRepoResult,
  GenerateMetaWorkerGitInfo,
} from '../../../../types';
import { MetaUCenterService } from '../../../microservices/meta-ucenter/meta-ucenter.service';
import { SiteConfigLogicService } from '../../../site/config/logicService';
import { GiteeService } from '../../giteeService';
import {
  registerSpecificPublisherService,
  SpecificPublisherService,
} from '../publisher.service';
import { GiteePublisherBaseService } from './gitee.publisher.base.service';

type CreateGiteePublisherRepoFromConfig = CreateGitRepoResult;

@Injectable()
export class GiteePublisherLogicService implements SpecificPublisherService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly baseService: GiteePublisherBaseService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly ucenterService: MetaUCenterService,
    private readonly giteeService: GiteeService,
  ) {
    registerSpecificPublisherService(
      MetaWorker.Enums.PublisherType.GITEE,
      this,
    );
  }

  public async getPublisherConfig(
    userId: number,
    siteConfigId: number,
  ): Promise<GiteePublisherProviderEntity> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherType !== MetaWorker.Enums.PublisherType.GITEE)
      throw new DataNotFoundException('publisher type not found');
    if (!config.publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');

    return await this.baseService.read(config.publisherProviderId);
  }

  public async createPublisherConfig(
    userId: number,
    siteConfigId: number,
    publisher: GiteePublisherProviderEntity,
  ): Promise<GiteePublisherProviderEntity> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherProviderId) throw new DataAlreadyExistsException();

    const newPublisher = Object.assign(
      new GiteePublisherProviderEntity(),
      publisher,
    );

    const result = await this.baseService.create(newPublisher);
    await this.siteConfigLogicService.updateSiteConfig(userId, siteConfigId, {
      ...config,
      publisherType: MetaWorker.Enums.PublisherType.GITEE,
      publisherProviderId: result.id,
    });

    return result;
  }

  public async updatePublisherConfig(
    userId: number,
    siteConfigId: number,
    publisher: GiteePublisherProviderEntity,
  ): Promise<GiteePublisherProviderEntity> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherType !== MetaWorker.Enums.PublisherType.GITEE)
      throw new DataNotFoundException('publisher type not found');
    if (!config.publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');

    const oldPublisher = await this.baseService.read(
      config.publisherProviderId,
    );
    if (!oldPublisher)
      throw new DataNotFoundException('Gitee publisher not found');

    return await this.baseService.update(oldPublisher, publisher);
  }

  public async deletePublisherConfig(
    userId: number,
    siteConfigId: number,
  ): Promise<DeleteResult> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherType !== MetaWorker.Enums.PublisherType.GITEE)
      throw new DataNotFoundException('publisher type not found');
    if (!config.publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');

    // remove siteConfig's publisherType and providerId
    await this.siteConfigLogicService.updateSiteConfig(userId, siteConfigId, {
      ...config,
      publisherType: null,
      publisherProviderId: null,
    });

    const publisher = await this.baseService.read(config.publisherProviderId);
    if (!publisher)
      throw new DataNotFoundException('Gitee publisher not found');

    return await this.baseService.delete(publisher.id);
  }

  private async getPublisherConfigById(
    sid: number,
  ): Promise<GiteePublisherProviderEntity> {
    const res = await this.baseService.read(sid);
    if (!res)
      throw new DataNotFoundException('Gitee publisher config not found');
    return res;
  }

  private async createGiteePublisherRepoFromConfig(
    token: string,
    cfg: GiteePublisherProviderEntity,
  ): Promise<CreateGiteePublisherRepoFromConfig> {
    const { userName, repoName } = cfg;
    return await this.giteeService.createGitRepo(
      token,
      userName,
      repoName,
      false, // Publisher repo is a public repo
    );
  }

  public async generateMetaWorkerGitInfo(
    userId: number,
    publisherProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    this.logger.verbose(`Generate meta worker Git info`, this.constructor.name);

    const token = await this.ucenterService.getGiteeAuthTokenByUserId(userId);

    this.logger.verbose(`Get publisher config`, this.constructor.name);
    const gitee = await this.getPublisherConfigById(publisherProviderId);

    this.logger.verbose(
      `Create Gitee publisher repo from config`,
      this.constructor.name,
    );
    const { status, empty } = await this.createGiteePublisherRepoFromConfig(
      token,
      gitee,
    );
    if (!status) {
      this.logger.error(
        `Create Gitee publisher repo from config failed`,
        this.constructor.name,
      );
    }

    const { userName, repoName, branchName, lastCommitHash, publishDir } =
      gitee;
    const gitInfo: MetaWorker.Info.Git = {
      token,
      serviceType: MetaWorker.Enums.GitServiceType.GITEE,
      username: userName,
      reponame: repoName,
      branchName: branchName,
      lastCommitHash: lastCommitHash,
    };
    const publishInfo: MetaWorker.Info.Publish = {
      publishBranch: branchName,
      publishDir: publishDir,
    };

    return { gitInfo, publishInfo, repoEmpty: empty };
  }
}
