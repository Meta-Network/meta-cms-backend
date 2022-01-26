import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { PostOrdersBaseService } from '../post-orders/post-orders.base.service';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { PostTasksBaseService } from './post-tasks.base.service';

@Injectable()
export class PostTasksLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly postTasksBaseService: PostTasksBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly postOrdersBaseService: PostOrdersBaseService,
  ) {}
}