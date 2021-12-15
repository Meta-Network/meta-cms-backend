import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeleteResult } from 'typeorm';

import { GiteeStorageProviderEntity } from '../../../../entities/provider/storage/gitee.entity';
import {
  DataAlreadyExistsException,
  DataNotFoundException,
} from '../../../../exceptions';
import {
  CreateGitRepoResult,
  GenerateMetaWorkerGitInfo,
  GitTreeInfo,
} from '../../../../types';
import { MetaUCenterService } from '../../../microservices/meta-ucenter/meta-ucenter.service';
import { SiteConfigLogicService } from '../../../site/config/logicService';
import { GiteeService } from '../../giteeService';
import {
  registerSpecificStorageService,
  SpecificStorageService,
} from '../service';
import { GiteeStorageBaseService } from './baseService';

type CreateGiteeRepoFromConfig = CreateGitRepoResult;

@Injectable()
export class GiteeStorageLogicService implements SpecificStorageService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly baseService: GiteeStorageBaseService,
    private readonly configLogicService: SiteConfigLogicService,
    private readonly giteeService: GiteeService,
    private readonly ucenterService: MetaUCenterService,
  ) {
    registerSpecificStorageService(MetaWorker.Enums.StorageType.GITEE, this);
  }

  public async getStorageConfig(
    uid: number,
    cid: number,
  ): Promise<GiteeStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== MetaWorker.Enums.StorageType.GITEE)
      throw new DataNotFoundException('storage type not found');
    if (!config.storeProviderId)
      throw new DataNotFoundException('storage provider id not found');

    return await this.baseService.read(config.storeProviderId);
  }

  public async createStorageConfig(
    uid: number,
    cid: number,
    storage: GiteeStorageProviderEntity,
  ): Promise<GiteeStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (
      config.storeType === MetaWorker.Enums.StorageType.GITEE &&
      config.storeProviderId
    )
      throw new DataAlreadyExistsException();

    const newStorage = Object.assign(new GiteeStorageProviderEntity(), storage);

    const result = await this.baseService.create(newStorage);
    await this.configLogicService.updateSiteConfig(uid, cid, {
      ...config,
      storeType: MetaWorker.Enums.StorageType.GITEE,
      storeProviderId: result.id,
    });

    return result;
  }

  public async updateStorageConfig(
    uid: number,
    cid: number,
    storage: GiteeStorageProviderEntity,
  ): Promise<GiteeStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== MetaWorker.Enums.StorageType.GITEE)
      throw new DataNotFoundException('storage type not found');
    if (!config.storeProviderId)
      throw new DataNotFoundException('storage provider id not found');

    const oldStorage = await this.baseService.read(config.storeProviderId);
    if (!oldStorage) throw new DataNotFoundException('Gitee storage not found');

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
    if (config.storeType !== MetaWorker.Enums.StorageType.GITEE)
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
    if (!storage) throw new DataNotFoundException('Gitee storage not found');

    return await this.baseService.delete(storage.id);
  }

  private async getStorageConfigById(
    sid: number,
  ): Promise<GiteeStorageProviderEntity> {
    const res = await this.baseService.read(sid);
    if (!res) throw new DataNotFoundException('Gitee storage config not found');
    return res;
  }

  private async createGiteeRepoFromConfig(
    token: string,
    cfg: GiteeStorageProviderEntity,
  ): Promise<CreateGiteeRepoFromConfig> {
    const { userName, repoName } = cfg;
    return await this.giteeService.createGitRepo(
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
    const token = await this.ucenterService.getGiteeAuthTokenByUserId(userId);

    this.logger.verbose(`Get storage config`, this.constructor.name);
    const gitee = await this.getStorageConfigById(providerId);

    this.logger.verbose(`Create Gitee repo from config`, this.constructor.name);
    const { status, empty } = await this.createGiteeRepoFromConfig(
      token,
      gitee,
    );
    if (!status) {
      this.logger.error(
        `Create Gitee repo from config failed`,
        this.constructor.name,
      );
    }

    const { userName, repoName, branchName, lastCommitHash } = gitee;
    const gitInfo: MetaWorker.Info.Git = {
      token,
      serviceType: MetaWorker.Enums.GitServiceType.GITEE,
      username: userName,
      reponame: repoName,
      branchName: branchName,
      lastCommitHash: lastCommitHash,
    };

    return { gitInfo, repoEmpty: empty };
  }

  public async getMetaWorkerGitInfo(
    userId: number,
    providerId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    this.logger.verbose(`Get meta worker Git info`, this.constructor.name);
    const token = await this.ucenterService.getGiteeAuthTokenByUserId(userId);
    this.logger.verbose(`Get storage config`, this.constructor.name);
    const gitee = await this.getStorageConfigById(providerId);
    const { userName, repoName, branchName, lastCommitHash } = gitee;
    const gitInfo: MetaWorker.Info.Git = {
      token,
      serviceType: MetaWorker.Enums.GitServiceType.GITEE,
      username: userName,
      reponame: repoName,
      branchName: branchName,
      lastCommitHash: lastCommitHash,
    };

    return { gitInfo, repoEmpty: false };
  }

  public async getGitTreeList(
    info: MetaWorker.Info.Git,
  ): Promise<GitTreeInfo[]> {
    const { token, username, reponame, branchName } = info;
    const data = await this.giteeService.getGitTree(
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
