import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { TaskWorkersBaseController } from '../task-workers.base-controller';
import { GitWorkersService } from './git-workers.service';

@ApiTags('tasks')
@Controller('task/git')
export class GitWorkersController extends TaskWorkersBaseController {
  constructor(private readonly gitWorkersService: GitWorkersService) {
    super(gitWorkersService);
  }
}
