import { MetaWorker } from '@metaio/worker-model';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { BullQueueType } from '../../../constants';
import { QueueTaskConfig } from '../../../types';
import { DockerTasksService } from '../docker/service';
import { TaskDispatchersService } from '../wokers/task-dispatchers.service';
import { TaskWorkersService } from '../wokers/task-workers.service';

@Injectable()
export class HexoWorkersService extends TaskWorkersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    protected readonly logger: LoggerService,
    @InjectQueue(BullQueueType.WORKER_HEXO)
    protected readonly workerQueue: Queue<QueueTaskConfig>,
    protected readonly taskDispatchersService: TaskDispatchersService,
    protected readonly dockerTasksService: DockerTasksService,
  ) {
    super(
      logger,
      workerQueue,
      taskDispatchersService,
      dockerTasksService,
      'meta-cms-worker-hexo',
      [
        MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG,
        MetaWorker.Enums.TaskMethod.HEXO_CREATE_POST,
        MetaWorker.Enums.TaskMethod.HEXO_GENERATE_DEPLOY,
      ],
    );
  }
}
