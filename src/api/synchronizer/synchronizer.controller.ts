import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AccessTokenService } from './access-token.service';

@Controller('synchronizer')
export class SynchronizerController {
  constructor(private readonly accessTokenService: AccessTokenService) {}

  @MessagePattern('user.socialauth.bound')
  async newAccessToken(
    @Payload() payload: { userId: number; platform: string; token: string },
  ) {
    const { userId, platform, token } = payload;
    await this.accessTokenService.save(userId, platform, token);
  }

  @MessagePattern('user.socialauth.unbound')
  async removeAccessToken(
    @Payload() payload: { userId: number; platform: string },
  ) {
    const { userId, platform } = payload;
    await this.accessTokenService.remove(userId, platform);
  }
}
