import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGiteeEntities1635922226202 implements MigrationInterface {
  name = 'AddGiteeEntities1635922226202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`meta-cms-dev\`.\`gitee_publisher_provider_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userName\` varchar(255) NOT NULL COMMENT 'Git user name', \`repoName\` varchar(255) NOT NULL COMMENT 'Git repo name', \`branchName\` varchar(255) NOT NULL COMMENT 'Git branch name', \`lastCommitHash\` varchar(255) NULL COMMENT 'Repo last commit hash', \`dataType\` enum ('HEXO') NOT NULL COMMENT 'Repo data type', \`publishDir\` varchar(255) NOT NULL COMMENT 'Git publish directory', \`useGitProvider\` tinyint NOT NULL COMMENT 'Use git provider' DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meta-cms-dev\`.\`gitee_storage_provider_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userName\` varchar(255) NOT NULL COMMENT 'Git user name', \`repoName\` varchar(255) NOT NULL COMMENT 'Git repo name', \`branchName\` varchar(255) NOT NULL COMMENT 'Git branch name', \`lastCommitHash\` varchar(255) NULL COMMENT 'Repo last commit hash', \`dataType\` enum ('HEXO') NOT NULL COMMENT 'Repo data type', \`useGitProvider\` tinyint NOT NULL COMMENT 'Use git provider' DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE \`meta-cms-dev\`.\`gitee_storage_provider_entity\``,
    );
    await queryRunner.query(
      `DROP TABLE \`meta-cms-dev\`.\`gitee_publisher_provider_entity\``,
    );
  }
}
