import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Octokit } from 'octokit';

import { GitPublisherProviderEntity } from '../../../../entities/provider/publisher/git.entity';
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
  ) {
    registerPublisherProvider(MetaWorker.Enums.PublisherType.GITHUB, this);
  }
  private readonly octokit: Octokit;

  public getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    return `${publishConfig.git.publisher.username}.github.io`;
  }

  public getTargetOriginDomainByEntity(
    entity: GitPublisherProviderEntity,
  ): string {
    return `${entity.userName}.github.io`;
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

  protected scheduleUpdateDomainName(
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
  async doUpdateDomainName(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
      site,
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });

    let siteInfo;
    let isDnsRecordValid = false;
    try {
      const dnsHealthResponse = await this.checkSiteDnsHealth(publishConfig);
      isDnsRecordValid =
        dnsHealthResponse.status &&
        dnsHealthResponse.data.domain === site.domain;
      siteInfo = (await this.getSiteInfo(publishConfig)).data;
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
      await octokit.request('PUT /repos/{owner}/{repo}/pages', data);
    }
  }
  async getSiteInfo(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });
    return await octokit.request('GET /repos/{owner}/{repo}/pages', {
      owner: publisher.username,
      repo: publisher.reponame,
    });
  }
  async checkSiteDnsHealth(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });
    return await octokit.request('GET /repos/{owner}/{repo}/pages/health', {
      owner: publisher.username,
      repo: publisher.reponame,
    });
  }
  async createSite(publishConfig: MetaWorker.Configs.PublishConfig) {
    this.logger.verbose(`Create site `, this.constructor.name);
    const {
      git: { publisher },
      publish,
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });
    return await octokit.request('POST /repos/{owner}/{repo}/pages', {
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
}
