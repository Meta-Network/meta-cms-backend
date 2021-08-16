import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseEntity } from 'src/entities/base.entity';
import { DataProcessType } from 'src/types/enum';
import { Column, Entity } from 'typeorm';

@Entity()
export class GitHubStorageProviderEntity extends BaseEntity {
  /**
   * GitHub user name
   * @example 'ghost'
   */
  @Column({ comment: 'GitHub user name' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  /**
   * GitHub repo name
   * @example 'my-awesome-site'
   */
  @Column({ comment: 'GitHub repo name' })
  @IsString()
  @IsNotEmpty()
  repoName: string;

  /**
   * GitHub branch name
   * @example 'master'
   */
  @Column({ comment: 'GitHub branch name' })
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
  @Column({ comment: 'Repo data type', type: 'enum', enum: DataProcessType })
  @IsEnum(DataProcessType)
  @IsNotEmpty()
  dataType: DataProcessType;

  /**
   * Use git provider
   * @default true
   * @example true
   */
  @Column({ comment: 'Use git provider', type: 'bool', default: true })
  @IsBoolean()
  @IsOptional()
  useGitProvider?: boolean = true;
}
