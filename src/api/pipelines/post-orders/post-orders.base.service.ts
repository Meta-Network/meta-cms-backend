import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import {
  DeepPartial,
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';

@Injectable()
export class PostOrdersBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
    @InjectRepository(PostMetadataEntity)
    private readonly postMetadatasRepository: Repository<PostMetadataEntity>,
  ) {}

  async pagi(
    options: IPaginationOptions,
    searchOptions?:
      | FindConditions<PostOrderEntity>
      | FindManyOptions<PostOrderEntity>,
  ): Promise<Pagination<PostOrderEntity>> {
    return (await paginate<PostOrderEntity>(
      this.postOrdersRepository,
      options,
      searchOptions,
    )) as Pagination<PostOrderEntity>;
  }

  async pagiByQueryBuilder(
    queryBuilder: SelectQueryBuilder<PostOrderEntity>,
    options: IPaginationOptions,
  ): Promise<Pagination<PostOrderEntity>> {
    return (await paginate<PostOrderEntity>(
      queryBuilder,
      options,
    )) as Pagination<PostOrderEntity>;
  }

  createQueryBuilder(): SelectQueryBuilder<PostOrderEntity> {
    return this.postOrdersRepository.createQueryBuilder('postOrderEntity');
  }

  async find(
    searchOptions?: FindManyOptions<PostOrderEntity>,
  ): Promise<PostOrderEntity[]> {
    return await this.postOrdersRepository.find(searchOptions);
  }

  create(entityLike: DeepPartial<PostOrderEntity>) {
    return this.postOrdersRepository.create(entityLike);
  }

  async getById(
    id: string,
    options?: FindOneOptions<PostOrderEntity>,
  ): Promise<PostOrderEntity> {
    return await this.postOrdersRepository.findOne(id, options);
  }
  async getFirstBySubmitState(
    submitState: PipelineOrderTaskCommonState,
  ): Promise<PostOrderEntity> {
    return await this.postOrdersRepository.findOne({
      where: {
        submitState,
      },
      order: { createdAt: 'ASC' },
    });
  }

  count(userId: number) {
    return this.postOrdersRepository
      .createQueryBuilder()
      .select('publishState', 'state')
      .addSelect('count(publishState)', 'count')
      .where('userId = :userId', { userId })
      .groupBy('state')
      .getRawMany();
  }

  async save(postOrderEntity: PostOrderEntity) {
    await this.postMetadatasRepository.save(postOrderEntity.postMetadata);

    return await this.postOrdersRepository.save(postOrderEntity);
  }

  async update(
    postOrderId: string,
    partialEntity: QueryDeepPartialEntity<PostOrderEntity>,
  ) {
    await this.postOrdersRepository.update(postOrderId, partialEntity);
  }

  async batchUpdate(
    creteria: string[] | FindConditions<PostOrderEntity>,
    partialEntity: QueryDeepPartialEntity<PostOrderEntity>,
  ) {
    await this.postOrdersRepository.update(creteria, partialEntity);
  }
}
