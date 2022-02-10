import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { PublishSiteTaskEntity } from '../../../entities/pipeline/publish-site-task.entity';

@Injectable()
export class PublishSiteTasksBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PublishSiteTaskEntity)
    private readonly publishSiteTasksRepository: Repository<PublishSiteTaskEntity>,
  ) {}
  async getById(id: string): Promise<PublishSiteTaskEntity> {
    return await this.publishSiteTasksRepository.findOne(id);
  }
  async getBySiteConfigUserId(
    siteConfigId: number,
    userId: number,
  ): Promise<PublishSiteTaskEntity> {
    return this.publishSiteTasksRepository.findOne(
      {
        siteConfigId,
        userId,
      },
      {
        order: {
          createdAt: 'DESC',
        },
      },
    );
  }
  async save(publishSiteTaskEntity: DeepPartial<PublishSiteTaskEntity>) {
    return await this.publishSiteTasksRepository.save(publishSiteTaskEntity);
  }

  async update(
    id: string,
    partialEntity: QueryDeepPartialEntity<PublishSiteTaskEntity>,
  ) {
    return await this.publishSiteTasksRepository.update(id, partialEntity);
  }
}
