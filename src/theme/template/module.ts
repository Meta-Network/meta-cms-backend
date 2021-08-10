import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeTemplateEntity } from '../../entities/themeTemplate.entity';
import { TemplateController } from './controller';
import { TemplateLogicService } from './logicService';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeTemplateEntity])],
  controllers: [TemplateController],
  providers: [TemplateLogicService],
  exports: [TemplateLogicService],
})
export class ThemeTemplateModule {}
