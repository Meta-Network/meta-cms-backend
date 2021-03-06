import { MetaWorker } from '@metaio/worker-model';
import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsLocale,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { SiteStatus } from '../types/enum';
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
   * @default 'Asia/Shanghai'
   * @example 'Asia/Shanghai'
   */
  @Column({ comment: 'Site timezone', default: 'Asia/Shanghai' })
  @IsString()
  @IsOptional()
  @IsIn(momentTimezone.tz.names())
  timezone?: string = 'Asia/Shanghai';

  /**
   * Site theme template id
   * @type number
   * @default null
   * @example 1
   */
  @Column({ comment: 'Site theme template id' })
  @IsInt()
  templateId: number;

  /**
   * Site domain
   * @type varchar(255)
   * @default null
   * @example 'www.example.com'
   */
  @Column({ comment: 'Site domain', nullable: true })
  @MaxLength(200)
  @IsString()
  @IsOptional()
  domain?: string | null = null;

  /**
   * Meta space prefix
   * @type varchar(255)
   * @example 'example'
   */
  @Column({ comment: 'Meta space prefix' })
  @IsString()
  @Length(3, 16)
  @Matches('\\w{3,16}')
  @Index({ unique: true })
  metaSpacePrefix: string;

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

  @Column({ comment: 'Site status', default: SiteStatus.Configured })
  @IsEnum(SiteStatus)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: SiteStatus.Configured })
  status?: SiteStatus = SiteStatus.Configured;

  @Column({ comment: 'Site last published at' })
  @ApiHideProperty()
  @ApiResponseProperty({ example: '2021-07-27T11:39:39.150Z' })
  readonly lastPublishedAt: Date;

  @ManyToOne(() => SiteInfoEntity, (info) => info.configs)
  @ApiHideProperty()
  siteInfo: SiteInfoEntity;
}
