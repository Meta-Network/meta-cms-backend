import { MetaWorker } from '@metaio/worker-model';
import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsFQDN,
  IsInt,
  IsLocale,
  IsOptional,
  IsString,
} from 'class-validator';
import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { SiteInfoEntity } from './siteInfo.entity';

@Entity()
export class SiteConfigEntity extends BaseEntity {
  /**
   * Site language
   * @type varchar(255)
   * @default 'en-US'
   * @example 'en-US'
   */
  @Column({ comment: 'Site language', default: 'en-US' })
  @IsLocale()
  @IsOptional()
  language?: string = 'en-US';

  /**
   * Site timezone
   * @type varchar(255)
   * @default ''
   * @example 'UTC+8'
   */
  @Column({ comment: 'Site timezone', default: '' })
  @IsString()
  @IsOptional()
  timezone?: string = '';

  /**
   * Site theme template id
   * @type number
   * @default null
   * @example 1
   */
  @Column({ comment: 'Site theme template id', nullable: true, default: null })
  @IsInt()
  @IsOptional()
  templateId?: number | null = null;

  /**
   * Site domain
   * @type varchar(255)
   * @default ''
   * @example 'www.example.com'
   */
  @Column({ comment: 'Site domain', default: '' })
  @IsFQDN()
  @IsOptional()
  domain?: string = '';

  /**
   * Site subdomain
   * @type varchar(255)
   * @default ''
   * @example 'www.example.com'
   */
  @Column({ comment: 'Site subdomain', default: '' })
  @IsFQDN()
  @IsOptional()
  subdomain?: string = '';

  /**
   * Site store type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site store type',
    type: 'enum',
    enum: MetaWorker.Enums.StorageType,
    nullable: true,
    default: null,
  })
  @IsEnum(MetaWorker.Enums.StorageType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  storeType?: MetaWorker.Enums.StorageType | null = null;

  /**
   * Site store provider id
   * @type number
   * @default null
   */
  @Column({ comment: 'Site store provider id', nullable: true, default: null })
  @IsInt()
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  storeProviderId?: number | null = null;

  /**
   * Site cicd type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site cicd type',
    type: 'enum',
    enum: MetaWorker.Enums.CICDType,
    nullable: true,
    default: null,
  })
  @IsEnum(MetaWorker.Enums.CICDType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  cicdType?: MetaWorker.Enums.CICDType | null = null;

  /**
   * Site cicd provider id
   * @type number
   * @default null
   */
  @Column({ comment: 'Site cicd provider id', nullable: true, default: null })
  @IsInt()
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  cicdProviderId?: number | null = null;

  /**
   * Site publisher type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site publisher type',
    type: 'enum',
    enum: MetaWorker.Enums.PublisherType,
    nullable: true,
    default: null,
  })
  @IsEnum(MetaWorker.Enums.PublisherType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  publisherType?: MetaWorker.Enums.PublisherType | null = null;

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
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  publisherProviderId?: number | null = null;

  /**
   * Site cdn type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site cdn type',
    type: 'enum',
    enum: MetaWorker.Enums.CDNType,
    nullable: true,
    default: null,
  })
  @IsEnum(MetaWorker.Enums.CDNType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  cdnType?: MetaWorker.Enums.CDNType | null = null;

  /**
   * Site cdn provider id
   * @type number
   * @default null
   */
  @Column({ comment: 'Site cdn provider id', nullable: true, default: null })
  @IsInt()
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  cdnProviderId?: number | null = null;

  @ManyToOne(() => SiteInfoEntity, (info) => info.configs)
  @ApiHideProperty()
  siteInfo: SiteInfoEntity;
}
