import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';
import { DeleteResult } from 'typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import {
  DataAlreadyExistsException,
  DataNotFoundException,
} from '../../../../exceptions';
import { CreateGitRepoResult } from '../../../../types';
import { GitHubStorageBaseService } from '../../../provider/storage/github/baseService';
import { SiteConfigLogicService } from '../../../site/config/logicService';
import { OctokitService } from '../../octokitService';

type CreateGitHubRepoFromConfig = CreateGitRepoResult;

@Injectable()
export class GitHubStorageLogicService {
  constructor(
    private readonly baseService: GitHubStorageBaseService,
    private readonly configLogicService: SiteConfigLogicService,
    private readonly octokitService: OctokitService,
  ) {}

  async getStorageConfig(
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

  async createStorageConfig(
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

  async updateStorageConfig(
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

  async deleteStorageConfig(uid: number, cid: number): Promise<DeleteResult> {
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

  /**
   * For internal use only
   */
  async getStorageConfigById(
    sid: number,
  ): Promise<GitHubStorageProviderEntity> {
    const res = await this.baseService.read(sid);
    if (!res)
      throw new DataNotFoundException('GitHub storage config not found');
    return res;
  }

  async createGitHubRepoFromConfig(
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
}
