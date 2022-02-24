import { Logger } from '@nestjs/common';

import { ValidationException } from '../../../exceptions';
import { MetadataStorageType } from '../../../types/enum';

const metadataStorageProviderMap = {};
export function registerMetadataStorageProvider(
  metadataStorageType: MetadataStorageType,
  metadataStorageProvider: MetadataStorageProvider,
) {
  metadataStorageProviderMap[metadataStorageType] = metadataStorageProvider;
  const logger = new Logger('MetadataStorageProvider');
  logger.log(`Register metadata storage provider: ${metadataStorageType}`);
}

export function getMetadataStorageProvider(
  metadataStorageType: MetadataStorageType,
): MetadataStorageProvider {
  // console.log(metadataStorageType, metadataStorageProviderMap);

  const instance = metadataStorageProviderMap[metadataStorageType];
  if (!instance) {
    throw new ValidationException('Invalid metadata storage type');
  }
  return instance;
}

export interface MetadataStorageProvider {
  get(refer: string): string | Promise<string>;
  /**
   * @param contentKey 内容对应的外部键，和get的refer不是一回事，主要是一些实现内部方便识别
   * @param content
   * @return refer
   */
  upload(contentKey: string, content: string): string | Promise<string>;
}
