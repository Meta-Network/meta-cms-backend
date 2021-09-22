import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TaskWorkerJobProcessorType, TaskWorkerType } from '../../../constants';
import { DockerProcessorsService } from './docker/docker-processors.service';
import { TaskWorkerJobProcessorDockerImpl } from './docker/task-steps.job-processor.docker-impl';
import { TaskStepsJobProcessorMockImpl } from './mock/task-steps.job-processor.mock-impl';

export function buildProcessor(
  taskWorkerType: TaskWorkerType,
  logger: LoggerService,
  configService: ConfigService,
  dockerTasksService: DockerProcessorsService,
) {
  //console.log(taskWorkerType, logger, configService, dockerTasksService);
  const typeShortName = taskWorkerType.toLocaleLowerCase().replace('_', '.');
  const processorType = configService.get<TaskWorkerJobProcessorType>(
    `task.${typeShortName}.processor.type`,
  );
  // console.log(`typeShortName ${typeShortName}, processorType ${processorType}`);
  if (TaskWorkerJobProcessorType.DOCKER === processorType) {
    logger.log('build task step job processor: DOCKER', 'buildProcessor');
    return new TaskWorkerJobProcessorDockerImpl(
      logger,
      dockerTasksService,
      configService.get<string>(
        `task.${typeShortName}.processor.docker.app.name`,
      ),
      configService.get<string>(`task.${typeShortName}.processor.docker.image`),
    );
  }
  logger.log('build task step job processor: MOCK', 'buildProcessor');

  return new TaskStepsJobProcessorMockImpl(logger, configService);
}
