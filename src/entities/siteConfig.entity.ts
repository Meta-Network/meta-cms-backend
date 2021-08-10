import {
  IsEnum,
  IsFQDN,
  IsInt,
  IsLocale,
  IsOptional,
  IsString,
} from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import { CDNType, CICDType, PublisherType, StorageType } from '../types/enum';
import { AutoDateEntity } from './autoDate.entity';
import { SiteInfoEntity } from './siteInfo.entity';

@Entity()
export class SiteConfigEntity extends AutoDateEntity {
  /** Primary key */
  @PrimaryGeneratedColumn({ comment: 'Site config id', unsigned: true })
  @ApiHideProperty()
  @ApiResponseProperty({ example: 1 })
  readonly id: number;

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
   * Site store type
   * @type enum
   * @default null
   */
  @Column({
    comment: 'Site store type',
    type: 'enum',
    enum: StorageType,
    nullable: true,
    default: null,
  })
  @IsEnum(StorageType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  storeType?: StorageType | null = null;

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
    enum: CICDType,
    nullable: true,
    default: null,
  })
  @IsEnum(CICDType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  cicdType?: CICDType | null = null;

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
    enum: PublisherType,
    nullable: true,
    default: null,
  })
  @IsEnum(PublisherType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  publisherType?: PublisherType | null = null;

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
    enum: CDNType,
    nullable: true,
    default: null,
  })
  @IsEnum(CDNType)
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: null })
  cdnType?: CDNType | null = null;

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
