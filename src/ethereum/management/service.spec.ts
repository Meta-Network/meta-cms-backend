import {
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';
import { splitSignature } from '@ethersproject/bytes';
import { Network } from '@ethersproject/providers';
import { MetaSpaceManagement } from '@metaio/meta-cms-contracts';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber, ethers } from 'ethers';
import { WinstonModule } from 'nest-winston';

import { configBuilder } from '../../configs';
import { WinstonConfigService } from '../../configs/winston';
import { ManagementEthereumService } from './service';
type JsonRpcNetwork = Network & { url: string };

describe('EthereumManagementService', () => {
  let network;
  let domain;
  let service: ManagementEthereumService;
  let configService: ConfigService;
  const authorizationTypedDataFieldFieled: Record<string, TypedDataField[]> = {
    Authorization: [
      { name: 'user', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
    ],
  };

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
      providers: [ManagementEthereumService],
    }).compile();
    configService = module.get<ConfigService>(ConfigService);

    service = module.get<ManagementEthereumService>(ManagementEthereumService);
    network = configService.get<JsonRpcNetwork>(
      'management.serverSign.network',
      {
        name: 'bsctest',
        chainId: 97,
        url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      },
    );

    domain = configService.get<TypedDataDomain>('management.domain');
    return service;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyAuthorization', () => {
    it('should return true', async () => {
      const user = configService.get<string>('testUser.address');
      const privateKey = configService.get<string>('testUser.privateKey');
      const provider = new ethers.providers.JsonRpcProvider(
        network.url,
        network,
      );
      const wallet = new ethers.Wallet(
        Buffer.from(privateKey, 'hex'),
        provider,
      );
      const timestamp = Date.now();
      const authMessage: MetaSpaceManagement.AuthorizationStruct = {
        user,
        timestamp,
      };
      const signature = await wallet._signTypedData(
        domain,
        authorizationTypedDataFieldFieled,
        authMessage,
      );
      const auth = {
        user,
        timestamp,
        signature,
      };
      console.log(JSON.stringify(auth));
      const result = await service.verifyAuthorization(auth);
      expect(result).toBe(true);
    });
  });
});
