import { Controller, Get, Param, Patch } from '@nestjs/common';

import { BasicAuth, SkipUCenterAuth } from '../../../decorators';
import { TaskConfig } from '../../../types/worker';

@Controller('task')
export class GitWorkerTaskController {
  @Get(':jobId')
  @SkipUCenterAuth(true)
  findOne(
    @BasicAuth() auth: string,
    @Param('jobId') jobId: string,
  ): TaskConfig | void {
    // return {};
    console.log(auth);
  }

  @Patch(':jobId')
  updateOne(
    @BasicAuth() auth: string,
    @Param('jobId') jobId: string,
  ): TaskConfig | void {
    // return {};
    console.log(auth);
  }
}
