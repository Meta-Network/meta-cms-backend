import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { TransformResponse } from '../../../utils/responseClass';
import { DomainvalidateResult } from './dto';
import { DomainValidateService } from './service';

class ValidateMetaSpacePrefixResponse extends TransformResponse<DomainvalidateResult> {
  @ApiProperty({ type: DomainvalidateResult })
  readonly data: DomainvalidateResult;
}

@ApiTags('domain')
@ApiCookieAuth()
@Controller('domain/validate')
export class DomainValidateController {
  constructor(private readonly service: DomainValidateService) {}

  @ApiOkResponse({ type: ValidateMetaSpacePrefixResponse })
  @Get(':prefix')
  async validateMetaSpacePrefix(@Param('prefix') prefix: string) {
    return await this.service.validateMetaSpacePrefix(prefix);
  }
}
