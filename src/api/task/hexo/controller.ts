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

import { TaskWorksBaseController } from '../workers/task-workers.base-controller';
import { HexoWorkersService } from './hexo-workers.service';

@Controller('task/hexo')
export class HexoWorkersController extends TaskWorksBaseController {
  constructor(private readonly hexoWorksService: HexoWorkersService) {
    super(hexoWorksService);
  }
}
