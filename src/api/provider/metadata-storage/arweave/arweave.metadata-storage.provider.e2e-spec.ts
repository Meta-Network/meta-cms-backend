import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WinstonModule } from 'nest-winston';

import { configBuilder } from '../../../../configs';
import { WinstonConfigService } from '../../../../configs/winston';
import { ArweaveMetadataStorageProvider } from './arweave.metadata-storage.provider';

describe('ArweaveMetadataStorageProvider (e2e)', () => {
  let configService: ConfigService;
  let metadataStorageProvider: ArweaveMetadataStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configBuilder],
        }),
        WinstonModule.forRootAsync({
          inject: [configService],
          useClass: WinstonConfigService,
        }),
      ],
      providers: [ArweaveMetadataStorageProvider],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    metadataStorageProvider = module.get<ArweaveMetadataStorageProvider>(
      ArweaveMetadataStorageProvider,
    );
  });

  it('should be defined', () => {
    expect(metadataStorageProvider).toBeDefined();
  });

  describe('get', () => {
    jest.setTimeout(15000);
    it('Could get Fs1Z9gUOAdNR7J5B8vy9oBazwfCbEIUbdQQKm9m-C6c', async () => {
      expect(
        await metadataStorageProvider.get(
          'Fs1Z9gUOAdNR7J5B8vy9oBazwfCbEIUbdQQKm9m-C6c',
        ),
      ).toEqual(
        '{"@context":"https://metanetwork.online/ns/cms","type":"server-verification-sign","signatureAlgorithm":"curve25519","version":"2021-11-01-01","publicKey":"0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f","nonce":"0x56219c9a5ab8f887c8201599","claim":"I, meta-cms.vercel.mttk.net authorize request (sign: 0x0f8107346a85bb69a18f8f7207d6d4c5acec3c56d3dd2f2b86af5a7e2e2c235f24630c8ebc66526d6733b025be23aaf77f0607f4d28a4e657d6ffb01ea264807) using key: 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f","signature":"0xab933b344a736756a9cb6dbeb4a339ea8c6376c08529498fc380ea445dd20400e0e7d8b458185843ee0d7ae2ea5193800967751fb8b1796ed8d867f5a821d80f","ts":1636621518393,"reference":[{"refer":"bafybeiasvap5r54lqaupkvlftvqaup5tnwydvadxer5a5ok4in45pk4qwq","body":{"@context":"https://metanetwork.online/ns/cms","type":"author-digest","algorithm":"sha256","version":"2021-11-01-01","title":"20211111 剁手节","cover":"","summary":"20211111 剁手节\\n","content":"20211111 剁手节\\n","license":"","categories":"","tags":"","digest":"0xf330071dd49cf084f6232a2f46a7218eec2f130c8e92eab2e890003d64bf89fb","ts":1636621506742}},{"refer":"bafybeif2ubfgz3t6lx3oq2f6wdwhhmop6as2tqz7rwiacs4letcyui25ia","body":{"@context":"https://metanetwork.online/ns/cms","type":"author-digest-sign","signatureAlgorithm":"curve25519","version":"2021-11-01-01","publicKey":"0x42df166e4d88caf0ed5daa42b188799e3ba31738547b0b956262d224ccd08043","digest":"0xf330071dd49cf084f6232a2f46a7218eec2f130c8e92eab2e890003d64bf89fb","nonce":"0x9291b1a5d3b5ae4d507ac5d3","claim":"I authorize publishing by metaspaces.life from this device using key: 0x42df166e4d88caf0ed5daa42b188799e3ba31738547b0b956262d224ccd08043","signature":"0x0f8107346a85bb69a18f8f7207d6d4c5acec3c56d3dd2f2b86af5a7e2e2c235f24630c8ebc66526d6733b025be23aaf77f0607f4d28a4e657d6ffb01ea264807","ts":1636621506746}}]}',
      );
    });
  });

  describe('upload', () => {
    jest.setTimeout(15000);
    it('Could upload plain text', async () => {
      const content = JSON.stringify({ message: 'Hello,World' });
      const cid = await metadataStorageProvider.upload(
        'alice-posts-1-sign',
        content,
      );
      expect(await metadataStorageProvider.get(cid)).toEqual(content);
    });
  });
});
