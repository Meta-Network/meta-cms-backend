import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeTemplateEntity } from 'src/entities/themeTemplate.entity';
import { TemplateController } from 'src/api/theme/template/controller';
import { TemplateLogicService } from 'src/api/theme/template/logicService';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeTemplateEntity])],
  controllers: [TemplateController],
  providers: [TemplateLogicService],
  exports: [TemplateLogicService],
})
export class ThemeTemplateModule {}
