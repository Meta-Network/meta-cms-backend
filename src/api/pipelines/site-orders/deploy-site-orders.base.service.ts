import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';

@Injectable()
export class DeploySiteOrdersBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(DeploySiteOrderEntity)
    private readonly deploySiteOrdersRepository: Repository<DeploySiteOrderEntity>,
  ) {}
}
