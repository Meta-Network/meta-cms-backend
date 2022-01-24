import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';
import { PublishSiteOrdersBaseService } from './publlish-site-orders.base.service';

@Injectable()
export class SiteOrdersLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deploySiteOrdersBaseService: DeploySiteOrdersBaseService,
    private readonly publishSiteOrdersBaseService: PublishSiteOrdersBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
  ) {}
}
