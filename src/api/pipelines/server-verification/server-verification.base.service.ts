import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { ServerVerificationEntity } from '../../../entities/pipeline/server-verification.entity';

@Injectable()
export class ServerVerificationBaseService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(ServerVerificationEntity)
    private readonly serverVerificationsRepository: Repository<ServerVerificationEntity>,
  ) {}

  async save(id: string, payload: string): Promise<ServerVerificationEntity> {
    return await this.serverVerificationsRepository.save({
      id,
      payload,
    });
  }

  async getById(id: string): Promise<ServerVerificationEntity> {
    return await this.serverVerificationsRepository.findOne(id);
  }
}
