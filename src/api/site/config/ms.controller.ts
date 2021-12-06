import { MetaInternalResult } from '@metaio/microservice-model';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { FetchSiteInfosReturn, SiteConfigLogicService } from './logicService';

@Controller()
export class SiteConfigMsController {
  constructor(private readonly service: SiteConfigLogicService) {}

  @MessagePattern('syncSiteInfo')
  async syncSiteInfo(
    @Payload()
    queries: {
      modifiedAfter: Date;
    },
  ): Promise<MetaInternalResult<FetchSiteInfosReturn[]>> {
    return this.service.fetchSiteInfos(queries);
  }
}
