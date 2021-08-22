import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Column, Entity } from 'typeorm';

import { TemplateType } from '../types/enum';
import { BaseEntity } from './base.entity';

@Entity()
export class ThemeTemplateEntity extends BaseEntity {
  /**
   * Template name
   * @type varchar(255)
   * @example 'Cactus'
   */
  @Column({ comment: 'Template name' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  /**
   * Template type
   * @type enum
   * @examole 'HEXO'
   */
  @Column({
    comment: 'Template type',
    type: 'enum',
    enum: TemplateType,
  })
  @IsEnum(TemplateType)
  @IsNotEmpty()
  templateType?: TemplateType;

  /**
   * Template repo Url
   * @type varchar(255)
   * @example 'https://github.com/whyouare111/hexo-theme-cactus.git'
   */
  @Column({ comment: 'Template repo Url' })
  @IsUrl()
  @IsNotEmpty()
  repoUrl: string;

  /**
   * Template repo branch name
   * @example 'master'
   */
  @Column({ comment: 'Template repo branch name' })
  @IsString()
  @IsNotEmpty()
  branchName: string;

  /**
   * Preview image
   * @type varchar(255)
   * @default null
   * @example 'https://example.com/site-preview.png'
   */
  @Column({ comment: 'Preview image', nullable: true, default: null })
  @IsUrl()
  @IsOptional()
  previewImage?: string | null = null;

  /**
   * Preview site
   * @type varchar(255)
   * @default null
   * @example 'https://example.com/preview'
   */
  @Column({ comment: 'Preview site', nullable: true, default: null })
  @IsUrl()
  @IsOptional()
  previewSite?: string | null = null;
}
