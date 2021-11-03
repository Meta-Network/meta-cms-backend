import { MetaWorker } from '@metaio/worker-model';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../base.entity';

@Entity()
export class GitStorageProviderEntity extends BaseEntity {
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
  @IsString()
  @IsNotEmpty()
  repoName: string;

  /**
   * Git branch name
   * @example 'master'
   */
  @Column({ comment: 'Git branch name' })
  @IsString()
  @IsNotEmpty()
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
}
