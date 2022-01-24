import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { DeploySiteTasksBaseService } from './deploy-site-tasks.base.service';
import { PublishSiteTasksBaseService } from './publish-site-tasks.base.service';

@Injectable()
export class SiteTasksLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deploySiteTasksBaseService: DeploySiteTasksBaseService,
    private readonly publishSiteTasksBaseService: PublishSiteTasksBaseService,
  ) {}
}
