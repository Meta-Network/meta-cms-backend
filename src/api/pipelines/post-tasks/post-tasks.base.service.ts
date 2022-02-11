import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  DeepPartial,
  FindConditions,
  FindManyOptions,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';

@Injectable()
export class PostTasksBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostTaskEntity)
    private readonly postTasksRepository: Repository<PostTaskEntity>,
  ) {}

  async getById(id: string): Promise<PostTaskEntity> {
    return await this.postTasksRepository.findOne(id);
  }

  async findOne(
    searchOptions?: FindManyOptions<PostTaskEntity>,
  ): Promise<PostTaskEntity> {
    return await this.postTasksRepository.findOne(searchOptions);
  }

  async find(
    searchOptions?: FindManyOptions<PostTaskEntity>,
  ): Promise<PostTaskEntity[]> {
    return await this.postTasksRepository.find(searchOptions);
  }

  async count(searchOptions?: FindManyOptions<PostTaskEntity>) {
    return await this.postTasksRepository.count(searchOptions);
  }

  async save(postTaskEntity: DeepPartial<PostTaskEntity>) {
    return await this.postTasksRepository.save(postTaskEntity);
  }

  async update(
    postTaskId: string,
    partialEntity: QueryDeepPartialEntity<PostTaskEntity>,
  ) {
    await this.postTasksRepository.update(postTaskId, partialEntity);
  }

  async batchUpdate(
    creteria: string[] | FindConditions<PostTaskEntity>,
    partialEntity: QueryDeepPartialEntity<PostTaskEntity>,
  ) {
    await this.postTasksRepository.update(creteria, partialEntity);
  }
}
