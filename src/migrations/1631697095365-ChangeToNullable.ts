import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeToNullable1631697095365 implements MigrationInterface {
  name = 'ChangeToNullable1631697095365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` CHANGE \`domain\` \`domain\` varchar(255) NULL COMMENT 'Site domain'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` CHANGE \`subdomain\` \`subdomain\` varchar(255) NULL COMMENT 'Site subdomain'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` CHANGE \`subdomain\` \`subdomain\` varchar(255) NOT NULL COMMENT 'Site subdomain' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` CHANGE \`domain\` \`domain\` varchar(255) NOT NULL COMMENT 'Site domain' DEFAULT ''`,
    );
  }
}
