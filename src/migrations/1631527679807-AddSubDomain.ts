import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubDomain1631527679807 implements MigrationInterface {
  name = 'AddSubDomain1631527679807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` ADD \`subdomain\` varchar(255) NOT NULL COMMENT 'Site subdomain' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` DROP COLUMN \`subdomain\``,
    );
  }
}
