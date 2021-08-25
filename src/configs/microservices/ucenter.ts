import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientsModuleOptionsFactory,
  NatsOptions,
} from '@nestjs/microservices';

@Injectable()
export class UCenterMicroserviceConfigService
  implements ClientsModuleOptionsFactory
{
  constructor(private readonly configService: ConfigService) {}

  async createClientOptions(): Promise<NatsOptions> {
    const ucenterConfig = this.configService.get<NatsOptions>(
      'microservice.clients.ucenter',
    );

    return ucenterConfig;
  }
}
