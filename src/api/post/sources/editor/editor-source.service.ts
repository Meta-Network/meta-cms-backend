import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DraftEntity } from '../../../../entities/draft.entity';
import type { SourceService } from '../../source-service.interface';

@Injectable()
export class EditorSourceService implements SourceService {
  constructor(
    @InjectRepository(DraftEntity)
    private readonly draftRepo: Repository<DraftEntity>,
  ) {}

  async fetch(path: string) {
    const { content } = await this.draftRepo.findOneOrFail(Number(path));

    return content;
  }
}
