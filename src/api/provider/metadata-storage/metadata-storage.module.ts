import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

// import { ConfigService } from '@nestjs/config';
// import { Contract, providers, Wallet } from 'ethers';
import { ArweaveMetadataStorageProvider } from './arweave/arweave.metadata-storage.provider';
// import * as InjectToken from './inject-token';
import { IpfsMetadataStorageProvider } from './ipfs/ipfs.metadata-storage.provider';
// import MappingContractABI from './mapping-contract.abi.json';
import { MetadataStorageService } from './metadata-storage.service';

@Module({
  imports: [HttpModule],
  providers: [
    IpfsMetadataStorageProvider,
    ArweaveMetadataStorageProvider,
    MetadataStorageService,
    // {
    //   provide: InjectToken.Contract,
    //   useFactory: (configService: ConfigService) => {
    //     const provider = new providers.JsonRpcProvider(
    //       configService.get<string>(
    //         'provider.metadataStorage.ipfs.blockchain.rpc',
    //       ),
    //       configService.get<number>(
    //         'provider.metadataStorage.ipfs.blockchain.chainId',
    //       ),
    //     );
    //     const wallet = new Wallet(
    //       configService.get<string>(
    //         'provider.metadataStorage.ipfs.blockchain.privateKey',
    //       ),
    //       provider,
    //     );
    //     return new Contract(
    //       configService.get<string>(
    //         'provider.metadataStorage.ipfs.blockchain.contractAddress',
    //       ),
    //       MappingContractABI,
    //       wallet,
    //     );
    //   },
    //   inject: [ConfigService],
    // },
  ],
  exports: [MetadataStorageService],
})
export class MetadataStorageModule {}
