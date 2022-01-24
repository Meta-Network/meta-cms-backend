import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';

@Injectable()
export class DeploySiteTasksBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(DeploySiteTaskEntity)
    private readonly deploySiteTasksRepository: Repository<DeploySiteTaskEntity>,
  ) {}
}
