import { MetaWorker } from '@metaio/worker-model';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Column, Entity } from 'typeorm';

import { NotMatches } from '../../../utils/classValidator';
import { BaseEntity } from '../../base.entity';

@Entity()
export class GitPublisherProviderEntity extends BaseEntity {
  /**
   * Git user name
   * @example 'ghost'
   */
  @Column({ comment: 'Git user name' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  /**
   * Git repo name
   * @example 'my-awesome-site'
   */
  @Column({ comment: 'Git repo name' })
  @IsNotEmpty()
  @IsString()
  @NotMatches(/^\.{1,2}$/, { message: 'repoName is reserved.' })
  @Matches(/^[.\-\w]{1,100}$/, {
    message:
      'repoName all code points must be either a hyphen (-), an underscore (_), a period (.), or an ASCII alphanumeric code point, max length 100 code points.',
  })
  repoName: string;

  /**
   * Git publish branch name
   * @example 'gh-pages'
   */
  @Column({ comment: 'Git branch name' })
  @IsString()
  @IsNotEmpty()
  @NotMatches(/^\/+/, {
    message: 'branchName must not leading with slash (/).',
  })
  @Matches(/^[\/\-\w]{1,250}$/, {
    message:
      'branchName all code points must be either a hyphen (-), an underscore (_), a slash (/), or an ASCII alphanumeric code point, max length 250 code points.',
  })
  branchName: string;

  /**
   * Repo last commit hash
   * @default null
   * @example '20a93ee211f2df64b748f3a5ed854a7881ebbff4'
   */
  @Column({ comment: 'Repo last commit hash', nullable: true, default: null })
  @IsString()
  @IsOptional()
  lastCommitHash?: string | null = null;

  /**
   * Repo data type
   * @example 'HEXO'
   */
  @Column({
    comment: 'Repo data type',
    type: 'enum',
    enum: MetaWorker.Enums.DataProcessType,
  })
  @IsEnum(MetaWorker.Enums.DataProcessType)
  @IsNotEmpty()
  dataType: MetaWorker.Enums.DataProcessType;

  /**
   * Git publish dir in repo
   *
   * @example 'public'
   */
  @Column({ comment: 'Git publish directory' })
  @IsString()
  @IsNotEmpty()
  publishDir: string;
}
