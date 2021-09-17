import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TaskWorkerJobProcessorType, TaskWorkerType } from '../../constants';
import { DockerTasksService } from './docker/service';
import { TaskWorkerJobProcessorDockerImpl } from './docker/task-worker-job.processor.docker.impl';
import { TaskWorkerJobProcessorMockImpl } from './workers/task-worker-job.processor.mock.impl';

export function buildProcessor(
  taskWorkerType: TaskWorkerType,
  logger: LoggerService,
  configService: ConfigService,
  dockerTasksService: DockerTasksService,
) {
  //console.log(taskWorkerType, logger, configService, dockerTasksService);
  const typeShortName = taskWorkerType.toLocaleLowerCase().replace('_', '.');
  const processorType = configService.get<TaskWorkerJobProcessorType>(
    `task.${typeShortName}.processor-type`,
  );
  // console.log(`typeShortName ${typeShortName}, processorType ${processorType}`);
  if (TaskWorkerJobProcessorType.DOCKER === processorType) {
    logger.log('build task worker job processor:DOCKER', 'buildProcessor');
    return new TaskWorkerJobProcessorDockerImpl(
      logger,
      dockerTasksService,
      configService.get<string>(`task.${typeShortName}.docker.image`),
    );
  }
  logger.log('build task worker job processor:MOCK', 'buildProcessor');

  return new TaskWorkerJobProcessorMockImpl(logger);
}
