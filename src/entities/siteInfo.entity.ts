import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { SiteConfigEntity } from './siteConfig.entity';

@Entity()
export class SiteInfoEntity extends BaseEntity {
  /** UCenter user id */
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsOptional()
  @ApiHideProperty()
  @ApiResponseProperty({ example: 1 })
  userId: number;

  /**
   * Site title
   * @type varchar(255)
   * @example 'Example'
   */
  @Column({ comment: 'Site title' })
  @Length(1, 50)
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Site subtitle
   * @type varchar(255)
   * @default ''
   * @example 'My awesome site'
   */
  @Column({ comment: 'Site subtitle', default: '' })
  @Length(1, 80)
  @IsString()
  @IsOptional()
  subtitle?: string = '';

  /**
   * Site description
   * @type text
   * @default ''
   * @example 'Much respect. So noble.'
   */
  @Column({ comment: 'Site description', type: 'text' })
  @Length(1, 200)
  @IsString()
  @IsOptional()
  description?: string = '';

  /**
   * Site author
   * @type varchar(255)
   * @default ''
   * @example 'John Doe'
   */
  @Column({ comment: 'Site author', default: '' })
  @Length(1, 50)
  @IsString()
  @IsOptional()
  author?: string = '';

  /**
   * Site keywords
   * @type Array<string>
   * @default null
   * @example ['Doge']
   */
  @Column({
    comment: 'Site keywords',
    type: 'simple-array',
    nullable: true,
    default: null,
  })
  @IsArray()
  @IsOptional()
  @MaxLength(60, { each: true })
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @ApiProperty({
    description: 'Site keywords',
    type: String,
    isArray: true,
    default: null,
    example: ['Doge'],
  })
  keywords?: string[] | null = null;

  /**
   * Site favicon link
   * @type varchar(255)
   * @default null
   * @example 'https://example.com/favicon.ico'
   */
  @Column({ comment: 'Site favicon link', nullable: true, default: null })
  @Length(8, 120)
  @IsUrl()
  @IsOptional()
  favicon?: string | null = null;

  @OneToMany(() => SiteConfigEntity, (conf) => conf.siteInfo, {
    nullable: true,
  })
  @ApiHideProperty()
  @ApiResponseProperty({ type: SiteConfigEntity, example: null })
  readonly configs?: SiteConfigEntity[] | null;
}
