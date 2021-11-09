import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterGitHubPublisherProviderTable1632821281521
  implements MigrationInterface
{
  name = 'AlterGitHubPublisherProviderTable1632821281521';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` ADD \`publishDir\` varchar(255) NOT NULL COMMENT 'GitHub publish directory'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`git_hub_publisher_provider_entity\` DROP COLUMN \`publishDir\``,
    );
  }
}
