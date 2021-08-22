import { Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { SkipUCenterAuth } from '../../decorators';
import { TaskConfig } from '../../types/worker';

@Controller('task')
export class TaskController {
  @Get(':jobId')
  @SkipUCenterAuth(true)
  findOne(@Req() request: Request, @Param('jobId') jobId: string): void {
    // return {};
    console.log(request);
  }

  // @Patch(':jobId')
  // updateOne(
  //   @Req() request: Request,
  //   @Param('jobId') jobId: string,
  // ): TaskConfig {
  //   return {};
  // }
}
