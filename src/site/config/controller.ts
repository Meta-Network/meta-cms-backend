import { Controller, Get, Param } from '@nestjs/common';
import { SiteConfigService } from './service';

@Controller('site')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get('config/:id')
  getSiteInfo(@Param('id') id: string) {
    return this.service.getSiteConfig(Number(id));
  }
}
