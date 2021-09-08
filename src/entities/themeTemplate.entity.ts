import { MetaWorker } from '@metaio/worker-model';
import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ThemeEntity } from './theme.entity';

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
    enum: MetaWorker.Enums.TemplateType,
  })
  @IsEnum(MetaWorker.Enums.TemplateType)
  @IsNotEmpty()
  templateType: MetaWorker.Enums.TemplateType;

  /**
   * Template repo Url
   * @type varchar(255)
   * @example 'https://github.com/Meta-Network/meta-hexo-starter.git'
   */
  @Column({ comment: 'Template repo Url' })
  @IsUrl()
  @IsNotEmpty()
  templateRepo: string;

  /**
   * Template repo branch name
   * @example 'master'
   */
  @Column({ comment: 'Template repo branch name' })
  @IsString()
  @IsNotEmpty()
  templateBranch: string;

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

  @OneToOne(() => ThemeEntity)
  @JoinColumn()
  @ApiHideProperty()
  @ApiResponseProperty({ type: ThemeEntity })
  theme: ThemeEntity;
}
