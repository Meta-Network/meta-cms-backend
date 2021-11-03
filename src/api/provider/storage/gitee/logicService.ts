import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';
import { DeleteResult } from 'typeorm';

import { GiteeStorageProviderEntity } from '../../../../entities/provider/storage/gitee.entity';
import {
  DataAlreadyExistsException,
  DataNotFoundException,
} from '../../../../exceptions';
import { CreateGitRepoResult } from '../../../../types';
import { SiteConfigLogicService } from '../../../site/config/logicService';
import { GiteeService } from '../../giteeService';
import { GiteeStorageBaseService } from './baseService';

type CreateGiteeRepoFromConfig = CreateGitRepoResult;

@Injectable()
export class GiteeStorageLogicService {
  constructor(
    private readonly baseService: GiteeStorageBaseService,
    private readonly configLogicService: SiteConfigLogicService,
    private readonly giteeService: GiteeService,
  ) {}

  async getStorageConfig(
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

  async createStorageConfig(
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

  async updateStorageConfig(
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

  async deleteStorageConfig(uid: number, cid: number): Promise<DeleteResult> {
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

  /**
   * For internal use only
   */
  async getStorageConfigById(sid: number): Promise<GiteeStorageProviderEntity> {
    const res = await this.baseService.read(sid);
    if (!res) throw new DataNotFoundException('Gitee storage config not found');
    return res;
  }

  async createGiteeRepoFromConfig(
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
}
