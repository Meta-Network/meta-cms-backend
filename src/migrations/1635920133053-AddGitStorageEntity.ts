import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGitStorageEntity1635920133053 implements MigrationInterface {
  name = 'AddGitStorageEntity1635920133053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_storage_provider_entity\` CHANGE \`userName\` \`userName\` varchar(255) NOT NULL COMMENT 'Git user name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_storage_provider_entity\` CHANGE \`repoName\` \`repoName\` varchar(255) NOT NULL COMMENT 'Git repo name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_storage_provider_entity\` CHANGE \`branchName\` \`branchName\` varchar(255) NOT NULL COMMENT 'Git branch name'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_storage_provider_entity\` CHANGE \`branchName\` \`branchName\` varchar(255) NOT NULL COMMENT 'GitHub branch name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_storage_provider_entity\` CHANGE \`repoName\` \`repoName\` varchar(255) NOT NULL COMMENT 'GitHub repo name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_storage_provider_entity\` CHANGE \`userName\` \`userName\` varchar(255) NOT NULL COMMENT 'GitHub user name'`,
    );
  }
}
