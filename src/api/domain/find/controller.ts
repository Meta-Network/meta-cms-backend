import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';

import { SkipAllAuth } from '../../../decorators';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { TransformResponse } from '../../../utils/responseClass';
import { DomainFindService } from './service';

class FindMetaSpacePrefixResponse extends TransformResponse<SiteConfigEntity> {
  @ApiProperty({ type: SiteConfigEntity, isArray: true })
  readonly data: SiteConfigEntity[];
}

@ApiTags('domain')
@Controller('domain/find')
export class DomainFindController {
  constructor(private readonly service: DomainFindService) {}

  @ApiOkResponse({ type: FindMetaSpacePrefixResponse })
  @ApiQuery({ name: 'prefix', type: String, example: 'test' })
  @ApiQuery({ name: 'limit', type: Number, example: 20 })
  @Get()
  @SkipAllAuth()
  async findMetaSpacePrefix(
    @Query('prefix') prefix: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return await this.service.findMetaSpacePrefix(prefix, limit);
  }
}
