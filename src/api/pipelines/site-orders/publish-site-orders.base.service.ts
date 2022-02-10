import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeepPartial, FindConditions, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';

@Injectable()
export class PublishSiteOrdersBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PublishSiteOrderEntity)
    private readonly publishSiteOrdersRepository: Repository<PublishSiteOrderEntity>,
  ) {}

  async getByPublishSiteTaskId(publishSiteTaskId: string) {
    return await this.publishSiteOrdersRepository.find({ publishSiteTaskId });
  }

  async save(
    entity: DeepPartial<PublishSiteOrderEntity>,
  ): Promise<PublishSiteOrderEntity> {
    return await this.publishSiteOrdersRepository.save(entity);
  }

  async batchUpdate(
    creteria: string[] | FindConditions<PublishSiteOrderEntity>,
    partialEntity: QueryDeepPartialEntity<PublishSiteOrderEntity>,
  ) {
    await this.publishSiteOrdersRepository.update(creteria, partialEntity);
  }
}
