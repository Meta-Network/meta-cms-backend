import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { DataNotFoundException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { SiteStatus } from '../../types/enum';
import { PublisherService } from '../provider/publisher/publisher.service';
import { StorageService } from '../provider/storage/service';
import { SiteService } from '../site/service';

@Injectable()
export class BaseTasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly siteService: SiteService,
    private readonly storageService: StorageService,
    private readonly publisherService: PublisherService,
  ) {}

  public async generateDeployConfigAndRepoSize(
    user: Partial<UCenterJWTPayload>,
    configId: number,
    validSiteStatus?: SiteStatus[],
  ): Promise<{
    deployConfig: MetaWorker.Configs.DeployConfig;
    repoEmpty: boolean;
  }> {
    this.logger.verbose(
      `Generate meta worker user info`,
      this.constructor.name,
    );
    const userInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

    const { site, template, theme, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(
        user,
        configId,
        validSiteStatus,
      );

    const { storageProviderId, storageType } = storage;
    if (!storageProviderId)
      throw new DataNotFoundException('storage provider id not found');
    const { gitInfo, repoEmpty } =
      await this.storageService.generateMetaWorkerGitInfo(
        storageType,
        user.id,
        storageProviderId,
      );
    // console.log('gitInfo', gitInfo);
    const deployConfig: MetaWorker.Configs.DeployConfig = {
      user: userInfo,
      site,
      template,
      theme,
      git: {
        storage: gitInfo,
      },
      gateway: this.configService.get('metaSpace.gateway'),
    };
    return {
      deployConfig,
      repoEmpty,
    };
  }

  public async generatePublishConfigAndTemplate(
    user: Partial<UCenterJWTPayload>,
    configId: number,
  ): Promise<{
    publisherType: MetaWorker.Enums.PublisherType;
    publishConfig: MetaWorker.Configs.PublishConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(
      `Generate meta worker site info`,
      this.constructor.name,
    );

    const { site, template, storage, publisher } =
      await this.siteService.generateMetaWorkerSiteInfo(user, configId, [
        SiteStatus.Deployed,
        SiteStatus.Publishing,
        SiteStatus.Published,
      ]);

    const { publisherProviderId, publisherType } = publisher;

    if (!publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');
    const { gitInfo: publisherGitInfo, publishInfo } =
      await this.publisherService.generateMetaWorkerGitInfo(
        publisherType,
        user.id,
        publisherProviderId,
      );
    const { storageProviderId, storageType } = storage;
    const { gitInfo: storageGitInfo } =
      await this.storageService.getMetaWorkerGitInfo(
        storageType,
        user.id,
        storageProviderId,
      );
    const publishConfig: MetaWorker.Configs.PublishConfig = {
      site,
      git: {
        storage: storageGitInfo,
        publisher: publisherGitInfo,
      },
      publish: publishInfo,
    };

    return {
      publisherType,
      publishConfig,
      template,
    };
  }

  public async generatePostConfigAndTemplate(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    configId: number,
  ): Promise<{
    postConfig: MetaWorker.Configs.PostConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(
      `Generate meta worker site info`,
      this.constructor.name,
    );

    const { site, template, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user, configId, [
        SiteStatus.Deployed,
        SiteStatus.Publishing,
        SiteStatus.Published,
      ]);
    const { storageProviderId, storageType } = storage;
    if (!storageProviderId)
      throw new DataNotFoundException('storage provider id not found');
    const { gitInfo } = await this.storageService.generateMetaWorkerGitInfo(
      storageType,
      user.id,
      storageProviderId,
    );
    const postConfig: MetaWorker.Configs.PostConfig = {
      user: {
        username: user.username,
        nickname: user.nickname,
      },
      site,
      post,
      git: {
        storage: gitInfo,
      },
    };
    return {
      postConfig,
      template,
    };
  }
}
