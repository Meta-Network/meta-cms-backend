import { MetaWorker } from '@metaio/worker-model2';
import Bull from 'bull';

import { WorkerModel2TaskConfig } from '../../../../types/worker-model2';

export interface WorkerTasksJobProcessor {
  process(job: Bull.Job<WorkerTasksJobDetail>);
}
export class WorkerTasksJobDetail {
  workerName: string;
  template: MetaWorker.Info.Template;
  taskConfig: WorkerModel2TaskConfig;
}

export const WORKER_TASKS_JOB_PROCESSOR = 'WORKER_TASK_JOB_PROCESSOR';

export interface WorkerTasksDispatchNextJobProcessor {
  process(job: Bull.Job<WorkerTasksDispatchNextJobDetail>);
}
export class WorkerTasksDispatchNextJobDetail {
  previousTaskId?: string;
}
export const WORKER_TASKS_DISPATCH_NEXT_JOB_PROCESSOR =
  'WORKER_TASKS_DISPATCH_NEXT_JOB_PROCESSOR';
