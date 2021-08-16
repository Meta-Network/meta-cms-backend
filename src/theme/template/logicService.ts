import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ThemeTemplateEntity } from 'src/entities/themeTemplate.entity';
import { TemplateQueryType, TemplateType } from 'src/types/enum';

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
        templateType: TemplateType[type],
      });

    return await this.templateRepository.find();
  }
}
