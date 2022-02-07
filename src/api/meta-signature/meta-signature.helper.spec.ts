import { Test, TestingModule } from '@nestjs/testing';

import { MetaSignatureHelper } from './meta-signature.helper';

describe('MetaSignatureHelper', () => {
  let metaSignatureHelper: MetaSignatureHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetaSignatureHelper],
    }).compile();

    metaSignatureHelper = module.get<MetaSignatureHelper>(MetaSignatureHelper);
  });

  it('should be defined', () => {
    expect(metaSignatureHelper).toBeDefined();
  });

  describe('createPostVerificationKey', () => {
    it('Should contain userId string & title pinyin', async () => {
      const userId = 111;
      const title = '测试标题';
      const key = metaSignatureHelper.createPostVerificationKey(userId, title);
      // console.log(key);
      expect(key).toContain(`${userId}`);
      expect(key).toContain('ce-shi-biao-ti');
    });
  });

  describe('createPublishMetaSpaceVerificationKey', () => {
    it('root', async () => {
      const userId = 111;
      const siteConfigId = 124;
      const key = metaSignatureHelper.createPublishMetaSpaceVerificationKey(
        userId,
        siteConfigId,
      );
      console.log(key);
      expect(key).toContain(`${userId}`);
      expect(key).toContain(`${siteConfigId}`);
    });
  });
});
