import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EncryptedDataDto {
  @ApiProperty({ description: 'Post IV' })
  @IsNotEmpty()
  @IsString()
  iv: string;

  @ApiProperty({ description: 'Encrypted data' })
  @IsNotEmpty()
  @IsString()
  encryptedData: string;
}
