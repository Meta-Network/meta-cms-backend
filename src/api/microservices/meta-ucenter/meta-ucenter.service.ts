import { MetaInternalResult } from '@metaio/microservice-model';
import { Inject, LoggerService, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';

import { MetaMicroserviceClient } from '../../../constants';
import { DataNotFoundException } from '../../../exceptions';

export class MetaUCenterService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(MetaMicroserviceClient.UCenter)
    private readonly ucenterClient: ClientProxy,
  ) {}

  async getGitHubAuthTokenByUserId(userId: number): Promise<string> {
    return await this.getSocialAuthTokenByUserId(userId, 'github');
  }

  async getSocialAuthTokenByUserId(
    userId: number,
    platform: string,
  ): Promise<string> {
    try {
      this.logger.verbose(
        `Get user ${platform} social token from UCenter microservice`,
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
      const token = new MetaInternalResult(result);
      if (!token.isSuccess()) {
        this.logger.error(
          `User  ${platform} social token not found: ${token.message}, code: ${token.code}`,
          this.constructor.name,
        );
        throw new DataNotFoundException(
          `user ${platform} social token not found`,
        );
      }
      return token.data;
    } catch (err) {
      this.logger.error(
        err,
        `Get user GitHub OAuth token error:`,
        this.constructor.name,
      );
      throw new DataNotFoundException('user GitHub OAuth token not found');
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