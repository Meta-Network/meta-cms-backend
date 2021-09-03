import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ThemeTemplateEntity } from '../../../entities/themeTemplate.entity';
import { TemplateQueryType } from '../../../types/enum';

@Injectable()
export class TemplateLogicService {
  constructor(
    @InjectRepository(ThemeTemplateEntity)
    private readonly templateRepository: Repository<ThemeTemplateEntity>,
  ) {}

  async getTemplates(
    type?: keyof typeof TemplateQueryType,
  ): Promise<ThemeTemplateEntity[]> {
    if (type === 'ALL') return await this.templateRepository.find();

    if (type)
      return await this.templateRepository.find({
        templateType: MetaWorker.Enums.TemplateType[type],
      });

    return await this.templateRepository.find();
  }

  async getTemplateById(tid: number): Promise<ThemeTemplateEntity> {
    return await this.templateRepository.findOne(tid);
  }
}
