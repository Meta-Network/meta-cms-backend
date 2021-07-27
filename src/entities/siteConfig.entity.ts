import { IsEnum, IsFQDN, IsInt, IsLocale, IsString } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AutoDateEntity } from './autoDate.entity';
import { SiteInfoEntity } from './siteInfo.entity';

export enum StoreType {
  LOCAL = 'LOCAL',
  GIT = 'GIT',
  IPFS = 'IPFS',
  OSS = 'OSS', // Object Storage Service
}

export enum CICDType {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  JENKINS = 'JENKINS',
  AZDO = 'AZDO', // Azure DevOps
  CIRCLE = 'CIRCLE',
}

export enum PublisherType {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  CLOUDFLARE = 'CLOUDFLARE',
  VERCEL = 'VERCEL',
}

export enum CDNType {
  CLOUDFLARE = 'CLOUDFLARE',
}

@Entity()
export class SiteConfigEntity extends AutoDateEntity {
  /** Primary key */
  @PrimaryGeneratedColumn({ comment: 'Site config id', unsigned: true })
  id: number;

  /**
   * Site language
   * @type varchar(255)
   * @default 'en-US'
   */
  @Column({ comment: 'Site language', default: 'en-US' })
  @IsLocale()
  language: string;

  /**
   * Site timezone
   * @type varchar(255)
   * @default ''
   */
  @Column({ comment: 'Site timezone', default: '' })
  @IsString()
  timezone: string;

  /**
   * Site theme
   * @type varchar(255)
   * @default ''
   */
  @Column({ comment: 'Site theme', default: '' })
  @IsString()
  theme: string;

  /**
   * Site domain
   * @type varchar(255)
   * @default ''
   */
  @Column({ comment: 'Site domain', default: '' })
  @IsFQDN()
  domain: string;

  /**
   * Site store type
   * @type enum
   * @default 'GIT'
   */
  @Column({
    comment: 'Site store type',
    type: 'enum',
    enum: StoreType,
    nullable: true,
    default: null,
  })
  @IsEnum(StoreType)
  storeType: StoreType | null;

  /**
   * Site store provider id
   * @type number
   * @default null
   */
  @Column({ comment: 'Site store provider id', nullable: true, default: null })
  @IsInt()
  storeProviderId: number | null;

  /**
   * Site cicd type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site cicd type',
    type: 'enum',
    enum: CICDType,
    nullable: true,
    default: null,
  })
  @IsEnum(CICDType)
  cicdType: CICDType | null;

  /**
   * Site cicd provider id
   * @type number
   * @default null
   */
  @Column({ comment: 'Site cicd provider id', nullable: true, default: null })
  @IsInt()
  cicdProviderId: number | null;

  /**
   * Site publisher type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site publisher type',
    type: 'enum',
    enum: PublisherType,
    nullable: true,
    default: null,
  })
  @IsEnum(PublisherType)
  publisherType: PublisherType | null;

  /**
   * Site publisher provider id
   * @type number
   * @default null
   */
  @Column({
    comment: 'Site publisher provider id',
    nullable: true,
    default: null,
  })
  @IsInt()
  publisherProviderId: number | null;

  /**
   * Site cdn type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site cdn type',
    type: 'enum',
    enum: CDNType,
    nullable: true,
    default: null,
  })
  @IsEnum(CDNType)
  cdnType: CDNType | null;

  /**
   * Site cdn provider id
   * @type number
   * @default null
   */
  @Column({ comment: 'Site cdn provider id', nullable: true, default: null })
  @IsInt()
  cdnProviderId: number | null;

  @ManyToOne(() => SiteInfoEntity, (info) => info.config)
  siteInfo: SiteInfoEntity;
}
