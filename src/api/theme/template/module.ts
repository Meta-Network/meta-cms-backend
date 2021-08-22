import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplateController } from '../../../api/theme/template/controller';
import { TemplateLogicService } from '../../../api/theme/template/logicService';
import { ThemeTemplateEntity } from '../../../entities/themeTemplate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeTemplateEntity])],
  controllers: [TemplateController],
  providers: [TemplateLogicService],
  exports: [TemplateLogicService],
})
export class ThemeTemplateModule {}
