import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeSubdomainToMetaSpacePrefix1631697282788
  implements MigrationInterface
{
  name = 'ChangeSubdomainToMetaSpacePrefix1631697282788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` CHANGE \`subdomain\` \`metaSpacePrefix\` varchar(255) NULL COMMENT 'Site subdomain'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` DROP COLUMN \`metaSpacePrefix\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` ADD \`metaSpacePrefix\` varchar(255) NULL COMMENT 'Meta space prefix'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` DROP INDEX \`IDX_3bd90d352dcaaf053188ec24fb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` DROP COLUMN \`metaSpacePrefix\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` ADD \`metaSpacePrefix\` varchar(255) NULL COMMENT 'Site subdomain'`,
    );
  }
}
