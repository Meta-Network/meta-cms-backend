import {
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';
import { splitSignature } from '@ethersproject/bytes';
import { Network } from '@ethersproject/networks';
import {
  MetaSpaceManagement,
  MetaSpaceManagement__factory,
} from '@metaio/meta-cms-contracts';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import assert from 'assert';
import { ethers } from 'ethers';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { ConfigKeyNotFoundException } from '../../exceptions';
import { stringSlice } from '../../utils';
import { ManagementAction, ManagementAuthorization } from './dto';

type JsonRpcNetwork = Network & { url: string };

@Injectable()
export class ManagementEthereumService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const nestLogger = new Logger(this.constructor.name); // Just for beautiful log
    this.domain = this.configService.get<TypedDataDomain>('management.domain');
    assert(
      this.domain.chainId,
      new ConfigKeyNotFoundException('management.domain.chainId'),
    );
    assert(
      this.domain.verifyingContract,
      new ConfigKeyNotFoundException('management.domain.verifyingContract'),
    );
    assert(
      this.domain.name,
      new ConfigKeyNotFoundException('management.domain.name'),
    );
    assert(
      this.domain.version,
      new ConfigKeyNotFoundException('management.domain.version'),
    );
    const defaultNetwork: JsonRpcNetwork = {
      name: 'bsctest',
      chainId: 97,
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    };
    const network = this.configService.get<JsonRpcNetwork>(
      'management.serverSign.network',
      defaultNetwork,
    );
    const privateKey = this.configService.get<string>(
      'management.serverSign.privateKey',
    );
    assert(
      privateKey,
      new ConfigKeyNotFoundException('management.serverSign.privateKey'),
    );
    const provider = new ethers.providers.JsonRpcProvider(network.url, network);
    this.wallet = new ethers.Wallet(Buffer.from(privateKey, 'hex'), provider);
    nestLogger.log(`Ethereum wallet address ${this.wallet.address}`);
    this.contract = MetaSpaceManagement__factory.connect(
      this.domain.verifyingContract,
      this.wallet,
    );
    nestLogger.log(`MetaSpaceManagement contract ${this.contract.address}`);
  }

  private readonly domain: TypedDataDomain;
  private readonly wallet: ethers.Wallet;
  private readonly contract: MetaSpaceManagement;
  private readonly actionTypedDataField: Record<string, TypedDataField[]> = {
    Action: [
      { name: 'initiator', type: 'address' },
      { name: 'name', type: 'string' },
    ],
  };
  private readonly authorizationTypedDataField: Record<
    string,
    TypedDataField[]
  > = {
    Authorization: [
      { name: 'user', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
    ],
  };
  private readonly verificationTypedDataField: Record<
    string,
    TypedDataField[]
  > = {
    Verification: [
      { name: 'server', type: 'address' },
      { name: 'user', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
  };

  private async signVerificationTypedData(
    message: MetaSpaceManagement.VerificationStruct,
  ): Promise<string> {
    this.logger.verbose(
      `Account ${
        this.wallet.address
      } sign verification signature data ${JSON.stringify(message)}`,
      this.constructor.name,
    );
    return await this.wallet._signTypedData(
      this.domain,
      this.verificationTypedDataField,
      message,
    );
  }

  private async verifyActionSignature(
    verify: MetaSpaceManagement.ActionStruct,
    signature: string,
  ): Promise<boolean> {
    const sign = stringSlice(signature, 18, 16);
    this.logger.verbose(
      `Verify action signature ${sign}`,
      this.constructor.name,
    );
    return await this.contract['verifySignature((address,string),bytes)'](
      verify,
      signature,
    );
  }

  private async verifyVerificationSignature(
    verify: MetaSpaceManagement.VerificationStruct,
    signature: string,
  ): Promise<boolean> {
    const sign = stringSlice(signature, 18, 16);
    this.logger.verbose(
      `Verify verification signature ${sign}`,
      this.constructor.name,
    );
    return await this.contract[
      'verifySignature((address,address,uint256,uint8,bytes32,bytes32),bytes)'
    ](verify, signature);
  }

  public verifyAddress(address: string): string {
    return ethers.utils.getAddress(address);
  }

  public async verifyAction(action: ManagementAction): Promise<boolean> {
    const { initiator, name, signature } = action;
    const message: MetaSpaceManagement.ActionStruct = {
      initiator,
      name,
    };
    return await this.verifyActionSignature(message, signature);
  }

  public async verifyAuthorization(
    auth: ManagementAuthorization,
  ): Promise<boolean> {
    const { user, timestamp, signature } = auth;
    const sign = splitSignature(signature);
    const message: MetaSpaceManagement.VerificationStruct = {
      user,
      timestamp,
      server: this.wallet.address,
      v: sign.v,
      r: sign.r,
      s: sign.s,
    };
    const serverSign = await this.signVerificationTypedData(message);
    return await this.verifyVerificationSignature(message, serverSign);
  }
}
