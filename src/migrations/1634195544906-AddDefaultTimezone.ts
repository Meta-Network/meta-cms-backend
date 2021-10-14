import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultTimezone1634195544906 implements MigrationInterface {
  name = 'AddDefaultTimezone1634195544906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` CHANGE \`timezone\` \`timezone\` varchar(255) NOT NULL COMMENT 'Site timezone' DEFAULT 'Asia/Shanghai'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` CHANGE \`timezone\` \`timezone\` varchar(255) NOT NULL COMMENT 'Site timezone' DEFAULT ''`,
    );
  }
}
