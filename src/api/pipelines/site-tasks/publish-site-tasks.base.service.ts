import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { PublishSiteTaskEntity } from '../../../entities/pipeline/publish-site-task.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';

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
    // index order
    return this.publishSiteTasksRepository.findOne(
      {
        userId,
        siteConfigId,
      },
      {
        order: {
          createdAt: 'DESC',
        },
      },
    );
  }
  async getBySiteConfigUserIdAndState(
    siteConfigId: number,
    userId: number,
    state: PipelineOrderTaskCommonState,
  ): Promise<PublishSiteTaskEntity> {
    // index order
    return this.publishSiteTasksRepository.findOne(
      {
        userId,
        siteConfigId,
        state,
      },
      {
        order: {
          createdAt: 'DESC',
        },
      },
    );
  }

  async count(searchOptions?: FindManyOptions<PublishSiteTaskEntity>) {
    return await this.publishSiteTasksRepository.count(searchOptions);
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
