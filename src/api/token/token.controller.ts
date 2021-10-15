import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '../../decorators';
import { AccessTokenEntity } from '../../entities/accessToken.entity';
import { InvalidPlatformException, RequirdHttpHeadersNotFoundException } from '../../exceptions';
import { ParsePlatformPipe } from '../../pipes/parse-platform.pipe';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import { TransformResponse } from '../../utils/responseClass';

class TokenListResponse extends TransformResponse<AccessTokenEntity> {
  @ApiProperty({ type: AccessTokenEntity, isArray: true })
  readonly data: AccessTokenEntity[];
}

class TokenEntityResponse extends TransformResponse<AccessTokenEntity> {
  @ApiProperty({ type: AccessTokenEntity })
  readonly data: AccessTokenEntity;
}

@Controller('token')
@ApiTags('token')
@ApiBadRequestResponse({
  type: RequirdHttpHeadersNotFoundException,
  description: 'When cookie with access token not provided',
})
export class TokenController {
  constructor(private accessTokenService: AccessTokenService) {}

  @Get()
  @ApiOkResponse({ type: TokenListResponse })
  async listToken(@User('id', ParseIntPipe) uid: number) {
    return await this.accessTokenService.read(uid);
  }

  @Post(':platform/enable_sync')
  @ApiCreatedResponse({ type: TokenEntityResponse })
  @ApiBadRequestResponse({
    type: InvalidPlatformException,
    description: 'When platform is invalid'
  })
  async enableSync(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform', ParsePlatformPipe) platform: string,
  ) {
    return await this.accessTokenService.updateActive(uid, platform, true);
  }

  @Post(':platform/disable_sync')
  @ApiCreatedResponse({ type: TokenEntityResponse })
  @ApiBadRequestResponse({
    type: InvalidPlatformException,
    description: 'When platform is invalid'
  })
  async disableSync(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform', ParsePlatformPipe) platform: string,
  ) {
    return await this.accessTokenService.updateActive(uid, platform, false);
  }
}
