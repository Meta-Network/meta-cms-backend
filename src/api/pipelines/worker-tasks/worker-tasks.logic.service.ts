import { MetaInternalResult } from '@metaio/microservice-model';
import { MetaWorker } from '@metaio/worker-model2';
import {
  Inject,
  Injectable,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { MetaWorkerTaskConfigV2 } from '../../../types/worker-model2';
import { PostTasksLogicService } from '../post-tasks/post-tasks.logic.service';
import { SiteTasksLogicService } from '../site-tasks/site-tasks.logic.service';

@Injectable()
export class WorkerTasksLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly postTasksLogicService: PostTasksLogicService,
    private readonly siteTasksLogicService: SiteTasksLogicService,
  ) {}

  async findOneTaskForWorker(
    auth: string,
    workerTaskId: string,
  ): Promise<MetaWorkerTaskConfigV2> {
    return;
  }

  async report(
    auth: string,
    workerTaskId: string,
    taskReport: MetaWorker.Info.TaskReport<unknown>,
  ) {
    this.logger.verbose(
      `Worker ${workerTaskId} report ${taskReport.reason} reason on ${taskReport.timestamp}`,
      this.constructor.name,
    );

    if (taskReport.reason === MetaWorker.Enums.TaskReportReason.HEALTH_CHECK) {
    } else if (
      taskReport.reason === MetaWorker.Enums.TaskReportReason.ERRORED
    ) {
      const internalResult = taskReport.data as MetaInternalResult<
        MetaWorker.Info.Post & Promise<Error>
      >;
    }
  }

  async authenticate(auth: string, workerTaskId: string) {
    if (!auth) {
      throw new UnauthorizedException();
    }
    const parts = auth.split(':');
    const username = parts[0],
      password = parts[1];
    // if(workerTaskId.indexOf('-site-')>0){

    // }
    // else if(workerTaskId.indexOf('-posts-')>0){

    // }
  }
}
