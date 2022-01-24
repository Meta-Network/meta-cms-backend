import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pipeline')
@Controller('v1/pipelines/site-orders')
export class SiteOrdersController {
  @Post('deploy')
  async deploy(): Promise<any> {
    return;
  }
  @Post('publish')
  async publish(): Promise<any> {
    return;
  }
}
