import { MetaWorker } from '@metaio/worker-model';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity()
export class ThemeEntity extends BaseEntity {
  /**
   * Theme name
   * @example 'master'
   */
  @Column({ comment: 'Theme name' })
  @IsString()
  @IsNotEmpty()
  themeName: string;

  /**
   * Theme repo Url
   * @type varchar(255)
   * @example 'https://github.com/whyouare111/hexo-theme-cactus.git'
   */
  @Column({ comment: 'Theme repo Url' })
  @IsUrl()
  @IsNotEmpty()
  themeRepo: string;

  /**
   * Theme repo branch name
   * @example 'master'
   */
  @Column({ comment: 'Theme repo branch name' })
  @IsString()
  @IsNotEmpty()
  themeBranch: string;

  /**
   * Theme type
   * @type enum
   * @examole 'HEXO'
   */
  @Column({
    comment: 'Theme type',
    type: 'enum',
    enum: MetaWorker.Enums.TemplateType, // Same as TemplateType
  })
  @IsEnum(MetaWorker.Enums.TemplateType)
  @IsNotEmpty()
  themeType: MetaWorker.Enums.TemplateType;

  @Column({
    comment: 'This theme is npm package',
    type: 'boolean',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPackage?: boolean = true;
}
