import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import { TemplateType } from '../types/enum';
import { AutoDateEntity } from './autoDate.entity';

@Entity()
export class ThemeTemplateEntity extends AutoDateEntity {
  /** Primary key */
  @PrimaryGeneratedColumn({ comment: 'Template id', unsigned: true })
  @ApiHideProperty()
  @ApiResponseProperty({ example: 1 })
  readonly id: number;

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
