import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SiteConfigService } from './service';

@Controller('site/config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get(':id')
  getSiteInfo(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSiteConfig(id);
  }
}
