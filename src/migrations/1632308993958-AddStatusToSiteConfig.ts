import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToSiteConfig1632308993958 implements MigrationInterface {
  name = 'AddStatusToSiteConfig1632308993958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` ADD \`status\` varchar(255) NOT NULL COMMENT 'Site status' DEFAULT 'CONFIGURED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` DROP COLUMN \`status\``,
    );
  }
}
