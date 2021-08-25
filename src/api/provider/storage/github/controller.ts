import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  LoggerService,
  OnApplicationBootstrap,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';
import { DeleteResult } from 'typeorm';

import {
  BullProcessorType,
  MetaMicroserviceClient,
} from '../../../../constants';
import { User } from '../../../../decorators';
import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import {
  AccessDeniedException,
  DataAlreadyExistsException,
  DataNotFoundException,
  RelationNotFoundException,
  ValidationException,
} from '../../../../exceptions';
import { UCenterJWTPayload } from '../../../../types';
import { MetaWorker } from '../../../../types/metaWorker';
import { TransformResponse } from '../../../../utils/responseClass';
import { GitHubStorageLogicService } from '../../../provider/storage/github/logicService';
import { SiteService } from '../../../site/service';
import { GitWorkerTasksService } from '../../../task/git/service';

class GitHubStorageResponse extends TransformResponse<GitHubStorageProviderEntity> {
  @ApiProperty({ type: GitHubStorageProviderEntity })
  readonly data: GitHubStorageProviderEntity;
}

class GitHubStorageDeleteResponse extends TransformResponse<DeleteResult> {
  @ApiProperty({ type: DeleteResult })
  readonly data: DeleteResult;
}

@ApiTags('storage')
@Controller('storage/github')
export class GitHubStorageController implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(MetaMicroserviceClient.UCenter)
    private readonly ucenterClient: ClientProxy,
    private readonly logicService: GitHubStorageLogicService,
    private readonly siteService: SiteService,
    private readonly taskService: GitWorkerTasksService,
  ) {}

  @ApiOkResponse({ type: GitHubStorageResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Get()
  async getStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.logicService.getStorageConfig(uid, configId);
  }

  @ApiCreatedResponse({ type: GitHubStorageResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiConflictResponse({
    type: DataAlreadyExistsException,
    description: 'When storage type and provider id already exists',
  })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Post()
  async createStorageConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() createDto: GitHubStorageProviderEntity,
  ) {
    try {
      const config = await this.logicService.createStorageConfig(
        user.id,
        configId,
        createDto,
      );

      await this.addGitHubWorkerTask(
        BullProcessorType.CREATE_SITE,
        configId,
        user,
        config,
      );

      return config;
    } catch (error) {
      await this.logicService.deleteStorageConfig(user.id, configId);
      if (error.message === 'Internal server error') {
        this.logger.error(error, 'Error: addGitHubWorkerTask faild');
        throw new DataNotFoundException('user github token not found');
      }
      throw error;
    }
  }

  @ApiOkResponse({ type: GitHubStorageResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage data not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Patch()
  async updateStorageConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() updateDto: GitHubStorageProviderEntity,
  ) {
    const result = await this.logicService.updateStorageConfig(
      user.id,
      configId,
      updateDto,
    );

    // Update config should run Hexo worker
    // await this.addGitWorkerQueue(
    //   BullProcessorType.UPDATE_SITE,
    //   configId,
    //   user,
    //   result,
    // );

    return result;
  }

  @ApiOkResponse({ type: GitHubStorageDeleteResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage data not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Delete()
  async deleteStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.logicService.deleteStorageConfig(uid, configId);
  }

  private async addGitHubWorkerTask(
    type: BullProcessorType,
    configId: number,
    user: UCenterJWTPayload,
    github: GitHubStorageProviderEntity,
  ): Promise<void> {
    const { userName, repoName, branchName, lastCommitHash } = github;
    const gitTokenFromUCenter = this.ucenterClient.send(
      'getSocialAuthTokenByUserId',
      { userId: user.id, platform: 'github' },
    );
    const token = await firstValueFrom(gitTokenFromUCenter);
    if (!token) {
      this.logger.error(
        'Send getSocialAuthTokenByUserId not found',
        'Error: user github token not found',
        GitWorkerTasksService.name,
      );
      throw new DataNotFoundException('user github token not found');
    }
    const workerGitInfo: MetaWorker.Info.Git = {
      gitToken: token.token,
      gitType: MetaWorker.Enums.GitServiceType.GITHUB,
      gitUsername: userName,
      gitReponame: repoName,
      gitBranchName: branchName,
      gitLastCommitHash: lastCommitHash,
    };

    const workerSiteInfo = await this.siteService.generateMetaWorkerSiteInfo(
      configId,
    );

    const workerUserInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

    const workerConfig: MetaWorker.Configs.GitHubWorkerConfig = {
      ...workerUserInfo,
      ...workerSiteInfo,
      ...workerGitInfo,
    };

    await this.taskService.addGitWorkerQueue(type, workerConfig);
  }

  async onApplicationBootstrap() {
    await this.ucenterClient.connect();
    this.logger.verbose(
      `Connect UCenter microservice client`,
      GitWorkerTasksService.name,
    );
  }
}
