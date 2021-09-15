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
export class GitWorkersService extends TaskWorkersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    protected readonly logger: LoggerService,
    @InjectQueue(BullQueueType.WORKER_GIT)
    protected readonly workerQueue: Queue<QueueTaskConfig>,
    protected readonly taskDispatchersService: TaskDispatchersService,
    protected readonly dockerTasksService: DockerTasksService,
  ) {
    super(
      logger,
      workerQueue,
      taskDispatchersService,
      dockerTasksService,
      'meta-cms-worker-git',
      [
        MetaWorker.Enums.TaskMethod.GIT_INIT_PUSH,
        MetaWorker.Enums.TaskMethod.GIT_OVERWRITE_PUSH,
        MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH,
        MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT,
      ],
    );
  }
}
