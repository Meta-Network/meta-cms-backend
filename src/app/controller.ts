import { Controller, Get, Request } from '@nestjs/common';
import { AppService } from './service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Request() req): string {
    console.log(req);
    return this.appService.getHello();
  }
}
