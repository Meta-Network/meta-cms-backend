import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';

@Injectable()
export class PublishSiteOrdersBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PublishSiteOrderEntity)
    private readonly publlishSiteOrdersRepository: Repository<PublishSiteOrderEntity>,
  ) {}
}
