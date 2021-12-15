import { CreateGitRepoResult, GetGitTreeResult } from '../../types';

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
}
