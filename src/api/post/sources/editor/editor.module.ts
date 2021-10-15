import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DraftEntity } from '../../../../entities/draft.entity';
import { EditorSourceService } from './editor-source.service';

@Module({
  imports: [TypeOrmModule.forFeature([DraftEntity])],
  providers: [EditorSourceService],
  exports: [EditorSourceService],
})
export class EditorModule {}
