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

import { TaskWorkersBaseController } from '../task-workers.base-controller';
import { HexoWorkersService } from './hexo-workers.service';

@Controller('task/hexo')
export class HexoWorkersController extends TaskWorkersBaseController {
  constructor(private readonly hexoWorksService: HexoWorkersService) {
    super(hexoWorksService);
  }
}
