import { MetaWorker } from '@metaio/worker-model';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskWorkerType } from '../../../constants';
import { QueueTaskConfig } from '../../../types';
import { TaskDispatchersService } from '../workers/task-dispatchers.service';
import { TaskWorkerJobProcessor } from '../workers/task-worker-job.processor';
import { TaskWorkersService } from '../workers/task-workers.service';

@Injectable()
export class GitWorkersService extends TaskWorkersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    protected readonly logger: LoggerService,
    @InjectQueue(TaskWorkerType.WORKER_GIT)
    protected readonly workerQueue: Queue<QueueTaskConfig>,
    protected readonly taskDispatchersService: TaskDispatchersService,
    @Inject('TASK_WORKER_JOB_PROCESSOR_GIT')
    protected readonly taskWorkerJobProcessor: TaskWorkerJobProcessor,
  ) {
    super(
      logger,
      workerQueue,
      taskDispatchersService,
      [
        MetaWorker.Enums.TaskMethod.GIT_INIT_PUSH,
        MetaWorker.Enums.TaskMethod.GIT_OVERWRITE_PUSH,
        MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH,
        MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT,
      ],
      taskWorkerJobProcessor,
    );
  }
}
