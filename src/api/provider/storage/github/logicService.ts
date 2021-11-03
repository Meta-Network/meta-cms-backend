import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeleteResult } from 'typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
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
import { OctokitService } from '../../octokitService';
import {
  registerSpecificStorageService,
  SpecificStorageService,
} from '../service';
import { GitHubStorageBaseService } from './baseService';

type CreateGitHubRepoFromConfig = CreateGitRepoResult;

@Injectable()
export class GitHubStorageLogicService implements SpecificStorageService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly baseService: GitHubStorageBaseService,
    private readonly configLogicService: SiteConfigLogicService,
    private readonly octokitService: OctokitService,
    private readonly ucenterService: MetaUCenterService,
  ) {
    registerSpecificStorageService(MetaWorker.Enums.StorageType.GITHUB, this);
  }

  public async getStorageConfig(
    uid: number,
    cid: number,
  ): Promise<GitHubStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== MetaWorker.Enums.StorageType.GITHUB)
      throw new DataNotFoundException('storage type not found');
    if (!config.storeProviderId)
      throw new DataNotFoundException('storage provider id not found');

    return await this.baseService.read(config.storeProviderId);
  }

  public async createStorageConfig(
    uid: number,
    cid: number,
    storage: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (
      config.storeType === MetaWorker.Enums.StorageType.GITHUB &&
      config.storeProviderId
    )
      throw new DataAlreadyExistsException();

    const newStorage = Object.assign(
      new GitHubStorageProviderEntity(),
      storage,
    );

    const result = await this.baseService.create(newStorage);
    await this.configLogicService.updateSiteConfig(uid, cid, {
      ...config,
      storeType: MetaWorker.Enums.StorageType.GITHUB,
      storeProviderId: result.id,
    });

    return result;
  }

  public async updateStorageConfig(
    uid: number,
    cid: number,
    storage: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== MetaWorker.Enums.StorageType.GITHUB)
      throw new DataNotFoundException('storage type not found');
    if (!config.storeProviderId)
      throw new DataNotFoundException('storage provider id not found');

    const oldStorage = await this.baseService.read(config.storeProviderId);
    if (!oldStorage)
      throw new DataNotFoundException('github storage not found');

    return await this.baseService.update(oldStorage, storage);
  }

  public async deleteStorageConfig(
    uid: number,
    cid: number,
  ): Promise<DeleteResult> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== MetaWorker.Enums.StorageType.GITHUB)
      throw new DataNotFoundException('storage type not found');
    if (!config.storeProviderId)
      throw new DataNotFoundException('storage provider id not found');

    // remove siteConfig's storageType and providerId
    await this.configLogicService.updateSiteConfig(uid, cid, {
      ...config,
      storeType: null,
      storeProviderId: null,
    });

    const storage = await this.baseService.read(config.storeProviderId);
    if (!storage) throw new DataNotFoundException('github storage not found');

    return await this.baseService.delete(storage.id);
  }

  private async getStorageConfigById(
    sid: number,
  ): Promise<GitHubStorageProviderEntity> {
    const res = await this.baseService.read(sid);
    if (!res)
      throw new DataNotFoundException('GitHub storage config not found');
    return res;
  }

  private async createGitHubRepoFromConfig(
    token: string,
    cfg: GitHubStorageProviderEntity,
  ): Promise<CreateGitHubRepoFromConfig> {
    const { userName, repoName } = cfg;
    return await this.octokitService.createGitRepo(
      token,
      userName,
      repoName,
      true, // Storage repo is a private repo
    );
  }

  public async generateMetaWorkerGitInfo(
    userId: number,
    providerId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    this.logger.verbose(`Generate meta worker Git info`, this.constructor.name);

    const token = await this.ucenterService.getGitHubAuthTokenByUserId(userId);

    this.logger.verbose(`Get storage config`, this.constructor.name);
    const github = await this.getStorageConfigById(providerId);

    this.logger.verbose(
      `Create GitHub repo from config`,
      this.constructor.name,
    );
    const { status, empty } = await this.createGitHubRepoFromConfig(
      token,
      github,
    );
    if (!status) {
      this.logger.error(
        `Create GitHub repo from config failed`,
        this.constructor.name,
      );
    }

    const { userName, repoName, branchName, lastCommitHash } = github;
    const gitInfo: MetaWorker.Info.Git = {
      token,
      serviceType: MetaWorker.Enums.GitServiceType.GITHUB,
      username: userName,
      reponame: repoName,
      branchName: branchName,
      lastCommitHash: lastCommitHash,
    };

    return { gitInfo, repoEmpty: empty };
  }
}
