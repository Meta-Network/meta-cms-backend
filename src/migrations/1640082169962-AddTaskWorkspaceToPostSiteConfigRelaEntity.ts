import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskWorkspaceToPostSiteConfigRelaEntity1640082169962
  implements MigrationInterface
{
  name = 'AddTaskWorkspaceToPostSiteConfigRelaEntity1640082169962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` ADD \`taskWorkspace\` varchar(255) NOT NULL COMMENT 'Task workspace for post task'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_f6eca9cac1c740ed9d7a732151\` ON \`post_site_config_rela_entity\` (\`taskWorkspace\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_f6eca9cac1c740ed9d7a732151\` ON \`post_site_config_rela_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` DROP COLUMN \`taskWorkspace\``,
    );
  }
}
