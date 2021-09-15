import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { TransformResponse } from '../../../utils/responseClass';
import { PostMethodValidation } from '../../../utils/validation';
import { DomainValidateRequest, DomainvalidateResult } from './dto';
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
  @Post()
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async validateMetaSpacePrefix(@Body() reqDto: DomainValidateRequest) {
    const { domain } = reqDto;
    return await this.service.validateMetaSpacePrefix(domain);
  }
}
