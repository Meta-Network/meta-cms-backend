import { ValidationPipeOptions } from '@nestjs/common';
import { IsArray, isEmpty, IsIn, validateSync } from 'class-validator';

import { SiteConfigEntity } from '../entities/siteConfig.entity';

class ResultListClass {
  constructor(list: boolean[]) {
    this.resultList = list;
  }
  @IsArray()
  @IsIn([true], { each: true })
  readonly resultList: boolean[];
}

export const checkConfigIsDeletable = (config: SiteConfigEntity): boolean => {
  const checkList = [
    'storeType',
    'storeProviderId',
    'cicdType',
    'cicdProviderId',
    'publisherType',
    'publisherProviderId',
    'cdnType',
    'cdnProviderId',
  ];
  const resultList = checkList.map((item) => isEmpty(config[item]));
  const obj = new ResultListClass(resultList);
  const errors = validateSync(obj);
  if (errors.length) return false;
  return true;
};

export const PostMethodValidation: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
};

export const PatchMethodValidation: ValidationPipeOptions = {
  ...PostMethodValidation,
  skipMissingProperties: true,
};
