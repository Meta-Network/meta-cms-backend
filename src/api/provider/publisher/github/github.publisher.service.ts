import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Connection, DeleteResult } from 'typeorm';

import { GitHubPublisherProviderEntity } from '../../../../entities/provider/publisher/github.entity';
import {
  DataAlreadyExistsException,
  DataNotFoundException,
} from '../../../../exceptions';
import { GenerateMetaWorkerGitInfo } from '../../../../types';
import { MetaUCenterService } from '../../../microservices/meta-ucenter/meta-ucenter.service';
import { SiteConfigLogicService } from '../../../site/config/logicService';
import { CreateGitHubRepoResult, OctokitService } from '../../octokitService';
import {
  registerSpecificPublisherService,
  SpecificPublisherService,
} from '../publisher.service';

type CreateGitHubPublisherRepoFromConfig = CreateGitHubRepoResult;

@Injectable()
export class GitHubPublisherService implements SpecificPublisherService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private connection: Connection,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly ucenterService: MetaUCenterService,
    private readonly octokitService: OctokitService,
  ) {
    registerSpecificPublisherService(
      MetaWorker.Enums.PublisherType.GITHUB,
      this,
    );
  }

  async read(
    publisherProviderId: number,
  ): Promise<GitHubPublisherProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    const find = await queryRunner.manager.findOne(
      GitHubPublisherProviderEntity,
      publisherProviderId,
    );
    await queryRunner.release();
    return find;
  }

  async create(
    publisherProvider: GitHubPublisherProviderEntity,
  ): Promise<GitHubPublisherProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newPublisher = queryRunner.manager.create(
        GitHubPublisherProviderEntity,
        publisherProvider,
      );
      const save = await queryRunner.manager.save(newPublisher);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    oldPublisherProvider: GitHubPublisherProviderEntity,
    newPublisherProvider: GitHubPublisherProviderEntity,
  ): Promise<GitHubPublisherProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const publisher = queryRunner.manager.merge(
        GitHubPublisherProviderEntity,
        oldPublisherProvider,
        newPublisherProvider,
      );
      const save = await queryRunner.manager.save(publisher);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async delete(publisherProviderId: number): Promise<DeleteResult> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const del = await queryRunner.manager.delete(
        GitHubPublisherProviderEntity,
        publisherProviderId,
      );
      await queryRunner.commitTransaction();
      return del;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async getPublisherConfig(
    userId: number,
    siteConfigId: number,
  ): Promise<GitHubPublisherProviderEntity> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherType !== MetaWorker.Enums.PublisherType.GITHUB)
      throw new DataNotFoundException('publisher type not found');
    if (!config.publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');

    return await this.read(config.publisherProviderId);
  }

  async createPublisherConfig(
    userId: number,
    siteConfigId: number,
    publisher: GitHubPublisherProviderEntity,
  ): Promise<GitHubPublisherProviderEntity> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherProviderId) throw new DataAlreadyExistsException();

    const newPublisher = Object.assign(
      new GitHubPublisherProviderEntity(),
      publisher,
    );

    const result = await this.create(newPublisher);
    await this.siteConfigLogicService.updateSiteConfig(userId, siteConfigId, {
      ...config,
      publisherType: MetaWorker.Enums.PublisherType.GITHUB,
      publisherProviderId: result.id,
    });

    return result;
  }

  async updatePublisherConfig(
    userId: number,
    siteConfigId: number,
    publisher: GitHubPublisherProviderEntity,
  ): Promise<GitHubPublisherProviderEntity> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherType !== MetaWorker.Enums.PublisherType.GITHUB)
      throw new DataNotFoundException('publisher type not found');
    if (!config.publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');

    const oldPublisher = await this.read(config.publisherProviderId);
    if (!oldPublisher)
      throw new DataNotFoundException('github Publisher not found');

    return await this.update(oldPublisher, publisher);
  }

  async deletePublisherConfig(
    userId: number,
    siteConfigId: number,
  ): Promise<DeleteResult> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    if (config.publisherType !== MetaWorker.Enums.PublisherType.GITHUB)
      throw new DataNotFoundException('publisher type not found');
    if (!config.publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');

    // remove siteConfig's publisherType and providerId
    await this.siteConfigLogicService.updateSiteConfig(userId, siteConfigId, {
      ...config,
      publisherType: null,
      publisherProviderId: null,
    });

    const publisher = await this.read(config.publisherProviderId);
    if (!publisher)
      throw new DataNotFoundException('github publisher not found');

    return await this.delete(publisher.id);
  }

  /**
   * For internal use only
   */
  protected async getPublisherConfigById(
    sid: number,
  ): Promise<GitHubPublisherProviderEntity> {
    const res = await this.read(sid);
    if (!res)
      throw new DataNotFoundException('gitHub publisher config not found');
    return res;
  }

  async createGitHubPublisherRepoFromConfig(
    token: string,
    cfg: GitHubPublisherProviderEntity,
  ): Promise<CreateGitHubPublisherRepoFromConfig> {
    const { userName, repoName } = cfg;
    return await this.octokitService.createGitHubRepo(
      token,
      userName,
      repoName,
      false, // Publisher repo is a public repo
    );
  }

  async generateMetaWorkerGitInfo(
    userId: number,
    publisherProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    this.logger.verbose(`Generate meta worker Git info`, this.constructor.name);

    const gitToken = await this.ucenterService.getGitHubAuthTokenByUserId(
      userId,
    );

    this.logger.verbose(
      `Get publisher config from GitHubPublisherService`,
      this.constructor.name,
    );
    const github = await this.getPublisherConfigById(publisherProviderId);

    this.logger.verbose(
      `Create GitHub publisher repo from config`,
      this.constructor.name,
    );
    const { status, size } = await this.createGitHubPublisherRepoFromConfig(
      gitToken,
      github,
    );
    if (!status) {
      this.logger.error(
        `Create GitHub publisher repo from config failed`,
        this.constructor.name,
      );
    }

    const { userName, repoName, branchName, lastCommitHash, publishDir } =
      github;
    const gitInfo: MetaWorker.Info.Git = {
      gitToken,
      gitType: MetaWorker.Enums.GitServiceType.GITHUB,
      gitUsername: userName,
      gitReponame: repoName,
      gitBranchName: branchName,
      gitLastCommitHash: lastCommitHash,
    };
    const publishInfo: MetaWorker.Info.Publish = {
      publishBranch: branchName,
      publishDir: publishDir,
    };

    return { gitInfo, publishInfo, repoSize: size };
  }
}
