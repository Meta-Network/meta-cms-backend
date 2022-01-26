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
  Repository,
} from 'typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';

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

  create(entityLike: DeepPartial<PostOrderEntity>) {
    return this.postOrdersRepository.create(entityLike);
  }

  async save(postOrderEntity: PostOrderEntity) {
    await this.postMetadatasRepository.save(postOrderEntity.postMetadata);
    return await this.postOrdersRepository.save(postOrderEntity);
  }
}