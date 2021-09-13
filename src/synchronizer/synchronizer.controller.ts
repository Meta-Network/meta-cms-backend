import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AccessTokenService } from './access-token.service';

@Controller('synchronizer')
export class SynchronizerController {
  constructor(private readonly accessTokenService: AccessTokenService) {}

  @MessagePattern('newAccessToken')
  async newAccessToken(
    @Payload() payload: { uid: number; platform: string; accessToken: string },
  ) {
    const { uid: userId, platform, accessToken } = payload;
    await this.accessTokenService.save(userId, platform, accessToken);
  }
}
