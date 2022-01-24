import {
  AuthorPostDigestMetadata,
  AuthorPostSignatureMetadata,
  BaseSignatureMetadata,
} from '@metaio/meta-signature-util-v2';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsHexadecimal,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PaginationResponse } from '../../../utils/responseClass';

export class AuthorPostDigestDto implements AuthorPostDigestMetadata {
  @ApiProperty({
    description: '元数据：JSON-LD上下文',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  '@context': 'https://metanetwork.online/ns/cms';
  @ApiProperty({
    description: '元数据：类型',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  '@type': 'author-post-digest';
  @ApiProperty({
    description: '元数据：版本号',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  '@version': string;
  @ApiProperty({
    description: '文章摘要算法',
    required: true,
    default: 'sha256',
    enum: ['sha256', 'sha512'],
  })
  @IsString()
  @IsNotEmpty()
  algorithm: 'sha256' | 'sha512';
  @ApiProperty({
    description: '文章标题',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;
  @ApiProperty({
    description: '文章分类。多个用,分隔，无值传空字符串',
    required: true,
  })
  @IsString()
  categories: string;
  @ApiProperty({
    description: '文章正文内容',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000000)
  content: string;
  @ApiProperty({
    description: '文章头图/封面URL',
    required: true,
  })
  @IsUrl()
  cover: string;
  @ApiProperty({
    description: '文章基于的许可协议',
    required: true,
  })
  @IsString()
  license: string;
  @ApiProperty({
    description: '文章概述',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  summary: string;
  @ApiProperty({
    description: '文章分类。多个用,分隔，无值传空字符串',
    required: true,
  })
  @IsString()
  tags: string;
  @ApiProperty({
    description: '文章数字摘要',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  digest: string;
  @ApiProperty({
    description: '作者签名时混入的随机数',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
  @ApiProperty({
    description: '作者签名时的宣称',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  claim: string;
  ts: number;
}
export class ReferenceItem {
  refer: string;
  rel: string;
  body: any;
}
export class AuthorPostSignDto
  implements AuthorPostSignatureMetadata, BaseSignatureMetadata
{
  @ApiProperty({
    description: '元数据：JSON-LD上下文',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  '@context': 'https://metanetwork.online/ns/cms';
  @ApiProperty({
    description: '元数据：类型',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  '@type': string;
  @ApiProperty({
    description: '元数据：版本号',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  '@version': string;

  @ApiProperty({
    description: '签名算法',
    required: true,
    default: 'curve25519',
    enum: ['curve25519'],
  })
  @IsString()
  @IsNotEmpty()
  signatureAlgorithm: 'curve25519';
  @ApiProperty({
    description: '作者签名密钥的公钥',
    required: true,
  })
  @IsHexadecimal()
  @IsNotEmpty()
  publicKey: string;
  @ApiProperty({
    description: '用于签名的文章元数据摘要',
    required: true,
  })
  @IsHexadecimal()
  @IsNotEmpty()
  digest: string;
  @ApiProperty({
    description: '作者签名时混入的随机数',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
  @ApiProperty({
    description: '作者签名时的宣称',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  claim: string;
  @ApiProperty({
    description: '签名',
    required: true,
  })
  @IsHexadecimal()
  @IsNotEmpty()
  signature: string;
  @ApiProperty({
    description: '签名的时间戳',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  ts: number;

  @ApiProperty({
    description: '关联的其他元数据',
    required: true,
  })
  @IsArray()
  reference: ReferenceItem[];
}

export class AuthorPostSignServerVerificationDto {
  @ApiProperty({
    description: '签名算法',
    required: true,
    default: 'curve25519',
    enum: ['curve25519'],
  })
  @IsString()
  @IsNotEmpty()
  signatureAlgorithm: 'curve25519';

  @ApiProperty({
    description: '服务器签名密钥的公钥',
    required: true,
  })
  @IsHexadecimal()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: '作者签名时混入的随机数',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
  @ApiProperty({
    description: '作者签名时的宣称',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  claim: string;
  @ApiProperty({
    description: '签名',
    required: true,
  })
  @IsHexadecimal()
  @IsNotEmpty()
  signature: string;
  @ApiProperty({
    description: '签名的时间戳',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  ts: number;
}

export class PostOrderRequestDto {
  authorPostDigest: AuthorPostDigestDto;
  authorPostSign: AuthorPostSignDto;
}
export class PostOrderResponseDto {
  postOrder: PostOrderEntity;
  serverVerification: AuthorPostSignServerVerificationDto;
}

export class PostOrderPaginationResponse extends PaginationResponse<PostOrderEntity> {
  @ApiProperty({ type: PostOrderEntity, isArray: true })
  readonly items: PostOrderEntity[];
}
