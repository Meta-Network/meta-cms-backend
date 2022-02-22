import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';

@Injectable()
export class DeploySiteTasksBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(DeploySiteTaskEntity)
    private readonly deploySiteTasksRepository: Repository<DeploySiteTaskEntity>,
  ) {}

  async getById(id: string): Promise<DeploySiteTaskEntity> {
    return await this.deploySiteTasksRepository.findOne(id);
  }
  async getBySiteConfigUserId(
    siteConfigId: number,
    userId: number,
  ): Promise<DeploySiteTaskEntity> {
    // match index order
    return await this.deploySiteTasksRepository.findOne({
      userId,
      siteConfigId,
    });
  }
  async count(searchOptions?: FindManyOptions<DeploySiteTaskEntity>) {
    return await this.deploySiteTasksRepository.count(searchOptions);
  }

  async save(
    deploySiteTaskEntity: DeepPartial<DeploySiteTaskEntity>,
  ): Promise<DeploySiteTaskEntity> {
    return await this.deploySiteTasksRepository.save(deploySiteTaskEntity);
  }

  async update(
    id: string,
    partialEntity: QueryDeepPartialEntity<DeploySiteTaskEntity>,
  ) {
    return await this.deploySiteTasksRepository.update(id, partialEntity);
  }
}
