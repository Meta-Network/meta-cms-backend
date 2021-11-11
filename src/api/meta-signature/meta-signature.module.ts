import { Module } from '@nestjs/common';

import { MetadataStorageModule } from '../provider/metadata-storage/metadata-storage.module';
import { MetaSignatureHelper } from './meta-signature.helper';
import { MetaSignatureService } from './meta-signature.service';

@Module({
  imports: [MetadataStorageModule],
  providers: [MetaSignatureService, MetaSignatureHelper],
  exports: [MetaSignatureService, MetaSignatureHelper],
})
export class MetaSignatureModule {}
