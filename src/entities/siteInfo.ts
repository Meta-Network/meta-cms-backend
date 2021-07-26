import { IsArray, IsInt, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AutoDate } from './autoDate';
import { SiteConfig } from './siteConfig';

@Entity()
export class SiteInfo extends AutoDate {
  /** Primary key */
  @PrimaryGeneratedColumn({ unsigned: true, comment: 'Primary key' })
  id: number;

  /** UCenter user id, required */
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  /**
   * Site title
   * @type varchar(255)
   */
  @Column({ comment: 'Site title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Site subtitle
   * @type varchar(255)
   * @default ''
   */
  @Column({ comment: 'Site subtitle', default: '' })
  @IsString()
  subtitle: string;

  /**
   * Site description
   * @type text
   * @default ''
   */
  @Column({ comment: 'Site description', type: 'text', default: '' })
  @IsString()
  description: string;

  /**
   * Site author
   * @type varchar(255)
   * @default ''
   */
  @Column({ comment: 'Site author', default: '' })
  @IsString()
  author: string;

  /**
   * Site keywords
   * @type Array<string>
   * @default null
   */
  @Column({
    comment: 'Site keywords',
    type: 'simple-array',
    nullable: true,
    default: null,
  })
  @IsArray()
  @IsString({ each: true })
  keywords: string[] | null;

  /**
   * Site favicon link
   * @type varchar(255)
   * @default ''
   */
  @Column({ comment: 'Site favicon link', default: '' })
  @IsUrl()
  favicon: string;

  @OneToMany(() => SiteConfig, (conf) => conf.siteInfo, { nullable: true })
  config: SiteConfig[] | null;
}
