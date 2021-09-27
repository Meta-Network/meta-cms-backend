import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Octokit } from 'octokit';

import {
  PublisherProvider,
  registerPublisherProvider,
} from './publisher.provider';

@Injectable()
export class GithubPublisherProvider implements PublisherProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    registerPublisherProvider(MetaWorker.Enums.PublisherType.GITHUB, this);
  }
  private readonly octokit: Octokit;
  getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    return `${publishConfig.git.gitUsername}.github.io`;
  }
  async updateDomainName(publishConfig: MetaWorker.Configs.PublishConfig) {
    const octokit = new Octokit({
      auth: publishConfig.git.gitToken,
    });
    try {
      await this.getSiteInfo(publishConfig);
    } catch (err) {
      await this.createSite(publishConfig);
    }
    await octokit.request('PUT /repos/{owner}/{repo}/pages', {
      owner: publishConfig.git.gitUsername,
      repo: publishConfig.git.gitReponame,
      cname: publishConfig.site.domain,
    });
  }
  async getSiteInfo(publishConfig: MetaWorker.Configs.PublishConfig) {
    const octokit = new Octokit({
      auth: publishConfig.git.gitToken,
    });
    return await octokit.request('GET /repos/{owner}/{repo}/pages', {
      owner: publishConfig.git.gitUsername,
      repo: publishConfig.git.gitReponame,
    });
  }

  async createSite(publishConfig: MetaWorker.Configs.PublishConfig) {
    this.logger.verbose(`Create site `, this.constructor.name);
    const octokit = new Octokit({
      auth: publishConfig.git.gitToken,
    });
    return await octokit.request('POST /repos/{owner}/{repo}/pages', {
      owner: publishConfig.git.gitUsername,
      repo: publishConfig.git.gitReponame,
      source: {
        branch: 'gh-pages',
        path: '/',
      },
      mediaType: {
        previews: ['switcheroo'],
      },
    });
  }
}
