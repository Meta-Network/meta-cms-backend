import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { TaskWorkersBaseController } from '../task-workers.base-controller';
import { HexoWorkersService } from './hexo-workers.service';

@ApiTags('tasks')
@Controller('task/hexo')
export class HexoWorkersController extends TaskWorkersBaseController {
  constructor(private readonly hexoWorksService: HexoWorkersService) {
    super(hexoWorksService);
  }
}
