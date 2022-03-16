import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';

@Injectable()
export class DeploySiteOrdersBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(DeploySiteOrderEntity)
    private readonly deploySiteOrdersRepository: Repository<DeploySiteOrderEntity>,
  ) {}

  async getById(id: string): Promise<DeploySiteOrderEntity> {
    return this.deploySiteOrdersRepository.findOne(id);
  }
  async getBySiteConfigUserId(
    siteConfigId: number,
    userId: number,
  ): Promise<DeploySiteOrderEntity> {
    return this.deploySiteOrdersRepository.findOne({
      userId,
      siteConfigId,
    });
  }

  createQueryBuilder(): SelectQueryBuilder<DeploySiteOrderEntity> {
    return this.deploySiteOrdersRepository.createQueryBuilder(
      'deploySiteOrderEntity',
    );
  }
  async getFirstByState(
    state: PipelineOrderTaskCommonState,
  ): Promise<DeploySiteOrderEntity> {
    return await this.deploySiteOrdersRepository.findOne({
      where: {
        state,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async save(
    deploySiteOrderEntity: DeepPartial<DeploySiteOrderEntity>,
  ): Promise<DeploySiteOrderEntity> {
    return this.deploySiteOrdersRepository.save(deploySiteOrderEntity);
  }

  async update(
    id: string,
    partialEntity: QueryDeepPartialEntity<DeploySiteOrderEntity>,
  ) {
    return await this.deploySiteOrdersRepository.update(id, partialEntity);
  }

  async updateByDeploySiteTaskId(
    deploySiteTaskId: string,
    partialEntity: QueryDeepPartialEntity<DeploySiteOrderEntity>,
  ) {
    return await this.deploySiteOrdersRepository.update(
      { deploySiteTaskId },
      partialEntity,
    );
  }
}
