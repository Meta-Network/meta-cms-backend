import { validateOrReject } from 'class-validator';
import { DeleteResult } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GitHubStorageProviderEntity } from '../../../entities/provider/storage/github.entity';
import {
  DataAlreadyExistsException,
  DataNotFoundException,
  validationErrorToBadRequestException,
} from '../../../exceptions';
import { SiteConfigLogicService } from '../../../site/config/logicService';
import { StorageType } from '../../../types/enum';
import { GitHubStorageBaseService } from './baseService';

@Injectable()
export class GitHubStorageLogicService {
  constructor(
    private readonly baseService: GitHubStorageBaseService,
    private readonly configLogicService: SiteConfigLogicService,
  ) {}

  async getStorageConfig(
    uid: number,
    cid: number,
  ): Promise<GitHubStorageProviderEntity> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== StorageType.GITHUB)
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
    try {
      const config = await this.configLogicService.validateSiteConfigUserId(
        cid,
        uid,
      );
      if (config.storeType === StorageType.GITHUB && config.storeProviderId)
        throw new DataAlreadyExistsException();

      const newStorage = Object.assign(
        new GitHubStorageProviderEntity(),
        storage,
      );
      await validateOrReject(newStorage);

      const result = await this.baseService.create(newStorage);
      await this.configLogicService.updateSiteConfig(
        uid,
        config.siteInfo.id,
        cid,
        {
          ...config,
          storeType: StorageType.GITHUB,
          storeProviderId: result.id,
        },
      );

      return result;
    } catch (error) {
      throw validationErrorToBadRequestException(error);
    }
  }

  async updateStorageConfig(
    uid: number,
    cid: number,
    storage: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    try {
      const config = await this.configLogicService.validateSiteConfigUserId(
        cid,
        uid,
      );
      if (config.storeType !== StorageType.GITHUB)
        throw new DataNotFoundException('storage type not found');
      if (!config.storeProviderId)
        throw new DataNotFoundException('storage provider id not found');

      const oldStorage = await this.baseService.read(config.storeProviderId);
      if (!oldStorage)
        throw new DataNotFoundException('github storage not found');

      const tmpStorage = Object.assign(
        new GitHubStorageProviderEntity(),
        storage,
      );
      await validateOrReject(tmpStorage, { skipMissingProperties: true });

      return await this.baseService.update(oldStorage, tmpStorage);
    } catch (error) {
      throw validationErrorToBadRequestException(error);
    }
  }

  async deleteStorageConfig(uid: number, cid: number): Promise<DeleteResult> {
    const config = await this.configLogicService.validateSiteConfigUserId(
      cid,
      uid,
    );
    if (config.storeType !== StorageType.GITHUB)
      throw new DataNotFoundException('storage type not found');
    if (!config.storeProviderId)
      throw new DataNotFoundException('storage provider id not found');

    // remove siteConfig's storageType and providerId
    await this.configLogicService.updateSiteConfig(
      uid,
      config.siteInfo.id,
      cid,
      {
        ...config,
        storeType: null,
        storeProviderId: null,
      },
    );

    const storage = await this.baseService.read(config.storeProviderId);
    if (!storage) throw new DataNotFoundException('github storage not found');

    return await this.baseService.delete(storage.id);
  }
}
