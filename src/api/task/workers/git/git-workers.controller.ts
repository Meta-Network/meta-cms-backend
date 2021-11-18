import { MetaWorker } from '@metaio/worker-model';
import {
  Body,
  Controller,
  Get,
  Inject,
  LoggerService,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BasicAuth, SkipUCenterAuth } from '../../../../decorators';
import { QueueTaskConfig } from '../../../../types';
import { TaskWorkersBaseController } from '../task-workers.base-controller';
import { GitWorkersService } from './git-workers.service';

@ApiTags('tasks')
@Controller('task/git')
export class GitWorkersController extends TaskWorkersBaseController {
  constructor(private readonly gitWorkersService: GitWorkersService) {
    super(gitWorkersService);
  }
}
