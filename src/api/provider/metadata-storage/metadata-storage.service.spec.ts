import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WinstonModule } from 'nest-winston';

import { configBuilder } from '../../../configs';
import { WinstonConfigService } from '../../../configs/winston';
import { MetadataStorageType } from '../../../types/enum';
import { MetadataStorageModule } from './metadata-storage.module';
import {
  getMetadataStorageProvider,
  MetadataStorageProvider,
} from './metadata-storage.provider';
import { MetadataStorageService } from './metadata-storage.service';

describe('MetadataStorageService', () => {
  let configService: ConfigService;
  let metadataStorageService: MetadataStorageService;
  let ipfsMetadataStorageProvider: MetadataStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configBuilder],
        }),
        WinstonModule.forRootAsync({
          inject: [ConfigService],
          useClass: WinstonConfigService,
        }),
        MetadataStorageModule,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    metadataStorageService = module.get<MetadataStorageService>(
      MetadataStorageService,
    );
    ipfsMetadataStorageProvider = getMetadataStorageProvider(
      MetadataStorageType.IPFS,
    );
  });

  it('should be defined', () => {
    expect(configService).toBeDefined();
    expect(metadataStorageService).toBeDefined();
  });

  it('ipfsMetadataStorageProvider should be defined', () => {
    expect(ipfsMetadataStorageProvider).toBeDefined();
  });

  describe('get', () => {
    it('Could get IPFS QmeoZEDYMxAdftJFSL874zFXhnQkK1C1Sj9wix8TDgQUpW', async () => {
      jest
        .spyOn(ipfsMetadataStorageProvider, 'get')
        .mockImplementationOnce(
          () =>
            '{"iv":"2d5e6caa687abb57feec8334a721a1ef","encryptedData":"351f6f01c59554d9b60a84acbf20d61097561acd9dc3529ab2d9eddb95da27b8acaeadd0d08bbe7c9164237b7222396fb016d883a255258a3c4f99f182b5667122ecbcd58850d6160d8eb0909d19dc074ad6ab4501d53d1596d39645f138e456944ff5fbc0d548c580314c9efdfcc7c2850a38d8aa1d1a18daab1524fb4e4134d96d15cb280a916669c90951d6986f7a31a1df4a2d1fcddca958444d45dc9417294405787bd77841128de14812c4d7619ad5ec1d7c21335259ec0141d83d213fa2ee6ca30e0cfa3c3fda6d421819722745031d26b47aedcbbce944f22a76e3e0a8a06c79e655b7290ec470b59b2f7b1866afba2e3aa5d4be5a097ae919a57fa3008dc4f7bfbc197d62ccd8dea79b28112cf1057c857f085c90cf1baab6030c4c4bc5bb788a72e6a6bb0016a0d739967eff3d79d43bf43a1660783f888ff4486fbf3254a8fe6629ea449aa4553f166b54546b048bb89621250fd521690d934a26ea2cc7000f54ae9d8bda949805d635f8b8beb0f24f2890580b476ffcc9d1644487d348dc3d0abd29d8a57963ef446fba1af2d91655ffad071704bcc94bfe427d687c3dd2b1aef5c3ae9ce1f13ea8aaccfd2cc77e6f2e0173e9c927345b462419bc1b37ccfbb3dae0d25660e244e09c4db412f631153ba12a6ecdbd212ca96a0985a4bc16d8685a0c8c70502e1a36a4431fe0add60906390d7489d2aff6fb52358b161a4e728006272492076249259a4c9052dba7f41f6edd55acd8d8cdb7d1a512f237aa37f0b48aeebf75a4f70c94593d7ed6cb8df408ece9a6d40211d4896ddf7cb7c198604eaf2272e098843166239a579218eeb13d024526762fe588cf955d34ba728a0d114567abc73b22b50cb29bcdb66153ea0396617a1b1f36121d468b609b02e58532f8517d0e6b7d134a06313b5b81eaeafaa6c3644eec8e6cd855d22701cb51bd673bf08fd13368ba9ee3a62247b6a7d0aac2d6d342895f1675b938ee898f19339f0d20bf159621f48bfcf8e6598266304071a02e8e96d06f6c8cb70b4e447152061674f617b4675312766a95f18f7a0ef4ba62c9ccf4cede0080e594b7a6016bae79ccf4c90c2a3423c4dbe97f4066a1604b12be491dfc5c742edb359870a043908f06e1d3c4212a52cc8e596e67303ac3e3ce23dfa8713f7279a32c7e6b5383fb6442e086f8aef1dc327cee5060b49d0a4adde6f7accf13bb2a554aaf7c92d9f04532dfb42ff3e9227fc09d4f61e30aa3bc17c8ec2ac2aaa72970850f26462fe5aef58c5e7ff39e3949caedd2f6a165004428e65ebc11d2d2b44649200cbc857508f934bdeac2838dd5c4f6e118338c2ab8e218fece5cba20eb57909ca76ab9144a8b3e46e20b00f618d5f25fc4d88a4eda1c44133370341090"}',
        );
      expect(
        await metadataStorageService.get(
          MetadataStorageType.IPFS,
          'QmeoZEDYMxAdftJFSL874zFXhnQkK1C1Sj9wix8TDgQUpW',
        ),
      ).toEqual(
        '{"iv":"2d5e6caa687abb57feec8334a721a1ef","encryptedData":"351f6f01c59554d9b60a84acbf20d61097561acd9dc3529ab2d9eddb95da27b8acaeadd0d08bbe7c9164237b7222396fb016d883a255258a3c4f99f182b5667122ecbcd58850d6160d8eb0909d19dc074ad6ab4501d53d1596d39645f138e456944ff5fbc0d548c580314c9efdfcc7c2850a38d8aa1d1a18daab1524fb4e4134d96d15cb280a916669c90951d6986f7a31a1df4a2d1fcddca958444d45dc9417294405787bd77841128de14812c4d7619ad5ec1d7c21335259ec0141d83d213fa2ee6ca30e0cfa3c3fda6d421819722745031d26b47aedcbbce944f22a76e3e0a8a06c79e655b7290ec470b59b2f7b1866afba2e3aa5d4be5a097ae919a57fa3008dc4f7bfbc197d62ccd8dea79b28112cf1057c857f085c90cf1baab6030c4c4bc5bb788a72e6a6bb0016a0d739967eff3d79d43bf43a1660783f888ff4486fbf3254a8fe6629ea449aa4553f166b54546b048bb89621250fd521690d934a26ea2cc7000f54ae9d8bda949805d635f8b8beb0f24f2890580b476ffcc9d1644487d348dc3d0abd29d8a57963ef446fba1af2d91655ffad071704bcc94bfe427d687c3dd2b1aef5c3ae9ce1f13ea8aaccfd2cc77e6f2e0173e9c927345b462419bc1b37ccfbb3dae0d25660e244e09c4db412f631153ba12a6ecdbd212ca96a0985a4bc16d8685a0c8c70502e1a36a4431fe0add60906390d7489d2aff6fb52358b161a4e728006272492076249259a4c9052dba7f41f6edd55acd8d8cdb7d1a512f237aa37f0b48aeebf75a4f70c94593d7ed6cb8df408ece9a6d40211d4896ddf7cb7c198604eaf2272e098843166239a579218eeb13d024526762fe588cf955d34ba728a0d114567abc73b22b50cb29bcdb66153ea0396617a1b1f36121d468b609b02e58532f8517d0e6b7d134a06313b5b81eaeafaa6c3644eec8e6cd855d22701cb51bd673bf08fd13368ba9ee3a62247b6a7d0aac2d6d342895f1675b938ee898f19339f0d20bf159621f48bfcf8e6598266304071a02e8e96d06f6c8cb70b4e447152061674f617b4675312766a95f18f7a0ef4ba62c9ccf4cede0080e594b7a6016bae79ccf4c90c2a3423c4dbe97f4066a1604b12be491dfc5c742edb359870a043908f06e1d3c4212a52cc8e596e67303ac3e3ce23dfa8713f7279a32c7e6b5383fb6442e086f8aef1dc327cee5060b49d0a4adde6f7accf13bb2a554aaf7c92d9f04532dfb42ff3e9227fc09d4f61e30aa3bc17c8ec2ac2aaa72970850f26462fe5aef58c5e7ff39e3949caedd2f6a165004428e65ebc11d2d2b44649200cbc857508f934bdeac2838dd5c4f6e118338c2ab8e218fece5cba20eb57909ca76ab9144a8b3e46e20b00f618d5f25fc4d88a4eda1c44133370341090"}',
      );
    });
  });

  describe('upload', () => {
    it('Could upload plain text', async () => {
      const content = JSON.stringify({ message: 'Hello,World' });
      jest
        .spyOn(ipfsMetadataStorageProvider, 'upload')
        .mockImplementationOnce((contentKey, content) => content);
      jest
        .spyOn(ipfsMetadataStorageProvider, 'get')
        .mockImplementationOnce(() => content);
      const cid = await metadataStorageService.upload(
        MetadataStorageType.IPFS,

        'alice-posts-1-sign',
        content,
      );
      expect(
        await metadataStorageService.get(MetadataStorageType.IPFS, cid),
      ).toEqual(content);
    });
  });
});
