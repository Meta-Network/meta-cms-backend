import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';

@Injectable()
export class PostTasksBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostTaskEntity)
    private readonly postTasksRepository: Repository<PostTaskEntity>,
  ) {}
}
