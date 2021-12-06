import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostTitleToPostSiteConfigRelaEntity1638781650582
  implements MigrationInterface
{
  name = 'AddPostTitleToPostSiteConfigRelaEntity1638781650582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_site_config_rela_entity\` ADD \`postTitle\` varchar(255) NOT NULL COMMENT 'Post title'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_9579ec254a90e5584db7a0bf8b\` ON \`meta-cms-dev\`.\`post_site_config_rela_entity\` (\`postTitle\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_9579ec254a90e5584db7a0bf8b\` ON \`meta-cms-dev\`.\`post_site_config_rela_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_site_config_rela_entity\` DROP COLUMN \`postTitle\``,
    );
  }
}
