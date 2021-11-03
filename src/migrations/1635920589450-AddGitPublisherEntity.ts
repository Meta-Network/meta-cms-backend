import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGitPublisherEntity1635920589450 implements MigrationInterface {
  name = 'AddGitPublisherEntity1635920589450';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`userName\` \`userName\` varchar(255) NOT NULL COMMENT 'Git user name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`repoName\` \`repoName\` varchar(255) NOT NULL COMMENT 'Git repo name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`branchName\` \`branchName\` varchar(255) NOT NULL COMMENT 'Git branch name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`publishDir\` \`publishDir\` varchar(255) NOT NULL COMMENT 'Git publish directory'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`publishDir\` \`publishDir\` varchar(255) NOT NULL COMMENT 'GitHub publish directory'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`branchName\` \`branchName\` varchar(255) NOT NULL COMMENT 'GitHub branch name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`repoName\` \`repoName\` varchar(255) NOT NULL COMMENT 'GitHub repo name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` CHANGE \`userName\` \`userName\` varchar(255) NOT NULL COMMENT 'GitHub user name'`,
    );
  }
}
