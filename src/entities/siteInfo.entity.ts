import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { BaseEntity } from 'src/entities/base.entity';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity()
export class SiteInfoEntity extends BaseEntity {
  /** UCenter user id */
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  @ApiHideProperty()
  @ApiResponseProperty({ example: 1 })
  userId: number;

  /**
   * Site title
   * @type varchar(255)
   * @example 'Example'
   */
  @Column({ comment: 'Site title' })
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
