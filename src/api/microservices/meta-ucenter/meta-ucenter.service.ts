import { MetaInternalResult } from '@metaio/microservice-model';
import { Inject, LoggerService, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';

import { DataNotFoundException } from '../../../exceptions';
import { UCenterUser } from '../../../types';
import { MetaMicroserviceClient } from '../../../types/enum';

export class MetaUCenterService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(MetaMicroserviceClient.UCenter)
    private readonly ucenterClient: ClientProxy,
  ) {}

  async getUserInfo(userId: number): Promise<MetaInternalResult<UCenterUser>> {
    return firstValueFrom(await this.ucenterClient.send('getUserInfo', userId));
  }

  async getGitHubAuthTokenByUserId(userId: number): Promise<string> {
    return await this.getSocialAuthTokenByUserId(userId, 'github');
  }

  async getGiteeAuthTokenByUserId(userId: number): Promise<string> {
    return await this.getSocialAuthTokenByUserId(userId, 'gitee');
  }

  async getSocialAuthTokenByUserId(
    userId: number,
    platform: string,
  ): Promise<string> {
    try {
      this.logger.verbose(
        `Get user ${userId} ${platform} social token from UCenter microservice`,
        this.constructor.name,
      );
      const gitTokenFromUCenter = this.ucenterClient.send(
        'getSocialAuthTokenByUserId',
        {
          userId,
          platform,
        },
      );
      const result = await firstValueFrom(gitTokenFromUCenter);
      const token = new MetaInternalResult<string>(result);
      if (!token.isSuccess()) {
        throw new DataNotFoundException(
          `${token.message} code: ${token.code}, user id ${userId}.`,
        );
      }
      return token.data;
    } catch (err) {
      this.logger.error(
        `Get user ${userId} ${platform} OAuth token error:`,
        err,
        this.constructor.name,
      );
      throw err;
    }
  }

  async onApplicationBootstrap() {
    await this.ucenterClient.connect();
    this.logger.verbose(
      `Connect UCenter microservice client`,
      this.constructor.name,
    );
  }
}
