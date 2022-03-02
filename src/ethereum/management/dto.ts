import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';

export class ManagementAction {
  @ApiProperty({ description: 'Initiator Ethereum address' })
  @IsDefined()
  @IsNotEmpty()
  @IsEthereumAddress()
  initiator: string;

  @ApiProperty({ description: 'Action name' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Signature string by signTypedData' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Matches(/^0x/, { message: 'signature must be an hex string' })
  signature: string;
}

export class ManagementAuthorization {
  @ApiProperty({ description: 'User Ethereum address' })
  @IsDefined()
  @IsNotEmpty()
  @IsEthereumAddress()
  user: string;

  @ApiProperty({ description: 'Timestamp by sign typed data' })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  timestamp: number;

  @ApiProperty({ description: 'Signature string by signTypedData' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Matches(/^0x/, { message: 'signature must be an hex string' })
  signature: string;
}
