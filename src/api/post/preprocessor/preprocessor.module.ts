import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PreProcessorService } from './preprocessor.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('post.preprocessor.urlprefix'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [PreProcessorService],
  exports: [PreProcessorService],
})
export class PreprocessorModule {}
