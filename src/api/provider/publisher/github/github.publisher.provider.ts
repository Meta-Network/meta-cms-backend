import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { GitPublisherProviderEntity } from '../../../../entities/provider/publisher/git.entity';
import { GitTreeInfo } from '../../../../types';
import { OctokitService } from '../../octokitService';
import {
  PublisherProvider,
  registerPublisherProvider,
} from '../publisher.provider';

@Injectable()
export class GitHubPublisherProvider implements PublisherProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly scheduleRegistry: SchedulerRegistry,
    private readonly octokitService: OctokitService,
  ) {
    registerPublisherProvider(MetaWorker.Enums.PublisherType.GITHUB, this);
  }

  public getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    const domain = `${publishConfig.git.publisher.username}.github.io`;
    return domain.toLowerCase();
  }

  public getTargetOriginDomainByPublisherConfig(
    config: GitPublisherProviderEntity,
  ): string {
    const domain = `${config.userName}.github.io`;
    return domain.toLowerCase();
  }

  public async updateDomainName(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    this.scheduleUpdateDomainName(
      publishConfig,
      this.configService.get<number[]>(
        'provider.publisher.github.updateDomainName.timeouts',
      ),
    );
  }

  private scheduleUpdateDomainName(
    publishConfig: MetaWorker.Configs.PublishConfig,
    timeouts: number[],
  ) {
    for (const timeout of timeouts) {
      this.scheduleRegistry.addTimeout(
        `update-github-pages-domain-${publishConfig.site.configId}-${
          new Date().getTime() + timeout
        }`,
        setTimeout(() => this.doUpdateDomainName(publishConfig), timeout),
      );
    }
  }

  private async doUpdateDomainName(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    const {
      git: { publisher },
      site,
    } = publishConfig;

    let siteInfo;
    let isDnsRecordValid = false;
    try {
      const dnsHealthResponse = await this.checkSiteDnsHealth(publishConfig);
      isDnsRecordValid = dnsHealthResponse.domain === site.domain;
      siteInfo = await this.getSiteInfo(publishConfig);
    } catch (err) {
      await this.createSite(publishConfig);
    }

    // if (siteInfo.cname !== publishConfig.site.domain) {
    if (isDnsRecordValid) {
      const dataBase = {
        owner: publisher.username,
        repo: publisher.reponame,
        cname: site.domain,
      };
      let data;
      if (siteInfo.public) {
        data = dataBase;
      } else {
        data = {
          ...dataBase,
          public: true,
          https_enforced: this.configService.get<boolean>(
            'provider.publisher.github.https_enforced',
            false,
          ),
        };
      }
      this.logger.verbose(
        `update cname ${data.owner}.github.io/${data.repo} : ${data.cname}`,
        this.constructor.name,
      );
      await this.octokitService.updateInfoAboutPagesSite(publisher.token, data);
    }
  }

  private async getSiteInfo(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
    } = publishConfig;
    const { token, username, reponame } = publisher;
    return await this.octokitService.getPagesSiteInfo(token, {
      owner: username,
      repo: reponame,
    });
  }

  private async checkSiteDnsHealth(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    const {
      git: { publisher },
    } = publishConfig;
    const { token, username, reponame } = publisher;
    return await this.octokitService.getPagesHealthCheck(token, {
      owner: username,
      repo: reponame,
    });
  }

  private async createSite(publishConfig: MetaWorker.Configs.PublishConfig) {
    this.logger.verbose(`Create site `, this.constructor.name);
    const {
      git: { publisher },
      publish,
    } = publishConfig;
    return await this.octokitService.createPagesSite(publisher.token, {
      owner: publisher.username,
      repo: publisher.reponame,
      source: {
        branch: publish.publishBranch,
        path: '/',
      },
      mediaType: {
        previews: ['switcheroo'],
      },
    });
  }

  public async getGitTreeList(
    info: MetaWorker.Info.Git,
  ): Promise<GitTreeInfo[]> {
    const { token, username, reponame, branchName } = info;
    const data = await this.octokitService.getGitTree(
      token,
      username,
      reponame,
      branchName,
      true,
    );
    const treeList = data?.tree || [];
    return treeList;
  }
}
