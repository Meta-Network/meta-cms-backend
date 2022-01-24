import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';

@Injectable()
export class PostOrdersBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
  ) {}
}
