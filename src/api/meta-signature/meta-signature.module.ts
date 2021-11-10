import { Module } from '@nestjs/common';

import { MetadataStorageModule } from '../provider/metadata-storage/metadata-storage.module';
import { MetaSignatureService } from './meta-signature.service';

@Module({
  imports: [MetadataStorageModule],
  providers: [MetaSignatureService],
  exports: [MetaSignatureService],
})
export class MetaSignatureModule {}
