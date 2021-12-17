import {
  CreateGitRepoResult,
  GetGitTreeResult,
  GitBlobInfo,
} from '../../types';

export abstract class AbstractGitService {
  public abstract createGitRepo(
    token: string,
    userName: string,
    repoName: string,
    privateRepo?: boolean,
  ): Promise<CreateGitRepoResult>;

  public abstract getGitTree(
    token: string,
    userName: string,
    repoName: string,
    branchOrSHA: string,
    recursive?: boolean,
  ): Promise<GetGitTreeResult>;

  public abstract getGitBlob(
    token: string,
    userName: string,
    repoName: string,
    blobSHA: string,
  ): Promise<GitBlobInfo>;
}
