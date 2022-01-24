import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PublishSiteTaskEntity } from '../../../entities/pipeline/publish-site-task.entity';

@Injectable()
export class PublishSiteTasksBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PublishSiteTaskEntity)
    private readonly publishSiteTasksRepository: Repository<PublishSiteTaskEntity>,
  ) {}
}
