import { MetaWorker } from '@metaio/worker-model';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskWorkerType } from '../../../../constants';
import { QueueTaskConfig } from '../../../../types';
import { TaskStepsJobProcessor } from '../../processors/task-steps.job-processor';
import { TaskDispatchersService } from '../task-dispatchers.service';
import { TaskWorkersService } from '../task-workers.service';

@Injectable()
export class HexoWorkersService extends TaskWorkersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    protected readonly logger: LoggerService,
    @InjectQueue(TaskWorkerType.WORKER_HEXO)
    protected readonly workerQueue: Queue<QueueTaskConfig>,
    protected readonly taskDispatchersService: TaskDispatchersService,
    @Inject('TASK_WORKER_JOB_PROCESSOR_HEXO')
    protected readonly taskWorkerJobProcessor: TaskStepsJobProcessor,
  ) {
    super(
      logger,
      workerQueue,
      taskDispatchersService,
      [
        MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG,
        MetaWorker.Enums.TaskMethod.HEXO_GENERATE_DEPLOY,
        MetaWorker.Enums.TaskMethod.HEXO_CREATE_POST,
        MetaWorker.Enums.TaskMethod.HEXO_UPDATE_POST,
        MetaWorker.Enums.TaskMethod.HEXO_DELETE_POST,
        MetaWorker.Enums.TaskMethod.HEXO_CREATE_DRAFT,
        MetaWorker.Enums.TaskMethod.HEXO_UPDATE_DRAFT,
        MetaWorker.Enums.TaskMethod.HEXO_PUBLISH_DRAFT,
        MetaWorker.Enums.TaskMethod.HEXO_MOVETO_DRAFT,
      ],
      taskWorkerJobProcessor,
    );
  }
}
