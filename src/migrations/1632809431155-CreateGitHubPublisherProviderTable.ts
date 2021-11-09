import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGitHubPublisherProviderTable1632809431155
  implements MigrationInterface
{
  name = 'CreateGitHubPublisherProviderTable1632809431155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userName\` varchar(255) NOT NULL COMMENT 'GitHub user name', \`repoName\` varchar(255) NOT NULL COMMENT 'GitHub repo name', \`branchName\` varchar(255) NOT NULL COMMENT 'GitHub branch name', \`lastCommitHash\` varchar(255) NULL COMMENT 'Repo last commit hash', \`dataType\` enum ('HEXO') NOT NULL COMMENT 'Repo data type', \`useGitProvider\` tinyint NOT NULL COMMENT 'Use git provider' DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\``,
    );
  }
}
