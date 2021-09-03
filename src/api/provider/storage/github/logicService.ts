import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Octokit } from 'octokit';
import { DeleteResult } from 'typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import {
  AccessDeniedException,
  DataAlreadyExistsException,
  DataNotFoundException,
  validationErrorToBadRequestException,
} from '../../../../exceptions';
import { GitHubStorageBaseService } from '../../../provider/storage/github/baseService';
import { SiteConfigLogicService } from '../../../site/config/logicService';

type CreateGitHubRepoFromConfig = {
  status: boolean;
  size: number;
  permissions?: {
    admin: boolean;
    maintain?: boolean;
    push: boolean;
    triage?: boolean;
    pull: boolean;
  };
};

@Injectable()
export class GitHubStorageLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
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
    try {
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
      await validateOrReject(newStorage);

      const result = await this.baseService.create(newStorage);
      await this.configLogicService.updateSiteConfig(
        uid,
        config.siteInfo.id,
        cid,
        {
          ...config,
          storeType: MetaWorker.Enums.StorageType.GITHUB,
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
      if (config.storeType !== MetaWorker.Enums.StorageType.GITHUB)
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

      return await this.baseService.update(oldStorage, storage);
    } catch (error) {
      throw validationErrorToBadRequestException(error);
    }
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
    const octokit = new Octokit({ auth: token });
    const { data: authData } = await octokit.rest.users.getAuthenticated();
    if (!authData)
      throw new AccessDeniedException("can not login GitHub with user's token");
    this.logger.verbose(
      `Successful login github with ${authData.login}`,
      GitHubStorageLogicService.name,
    );

    const { userName, repoName } = cfg;

    try {
      this.logger.verbose(
        `Check user GitHub repo permissions`,
        GitHubStorageLogicService.name,
      );
      const { data: repoData } = await octokit.rest.repos.get({
        owner: userName,
        repo: repoName,
      });
      const { pull, push } = repoData?.permissions;
      if (!(pull && push)) {
        this.logger.verbose(
          `Insufficient GitHub permissions, pull: ${pull}, push: ${push}`,
          GitHubStorageLogicService.name,
        );
        throw new AccessDeniedException(
          `Insufficient GitHub permissions, pull: ${pull}, push: ${push}`,
        );
      }
      this.logger.verbose(
        `Repo ${repoData.full_name} already exists, size: ${repoData.size}, pull: ${pull} push: ${push}`,
        GitHubStorageLogicService.name,
      );
      console.log(repoData);
      return {
        status: true,
        size: repoData.size,
        permissions: repoData.permissions,
      };
      // throw new Error('DEBUG'); // TODO: How to check github repo not empty
    } catch (error) {
      if (error.status === 404) {
        this.logger.verbose(
          `Repo ${userName}/${repoName} does not exists`,
          GitHubStorageLogicService.name,
        );
        if (userName === authData.login) {
          const { data: repoData } =
            await octokit.rest.repos.createForAuthenticatedUser({
              name: repoName,
              private: true,
              auto_init: false,
            });
          const { pull, push } = repoData?.permissions;
          this.logger.verbose(
            `Repo ${repoData.full_name} created, size: ${repoData.size}, pull: ${pull} push: ${push}`,
            GitHubStorageLogicService.name,
          );
          console.log(repoData);
          return {
            status: true,
            size: repoData.size,
            permissions: repoData.permissions,
          };
        }
        this.logger.verbose(
          `GitHub user ${authData.login} not match repo owner ${userName}`,
          GitHubStorageLogicService.name,
        );
      }
      throw error;
    }
  }
}
