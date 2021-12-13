import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeSiteConfigColumnProps1637235914291
  implements MigrationInterface
{
  name = 'ChangeSiteConfigColumnProps1637235914291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` CHANGE \`metaSpacePrefix\` \`metaSpacePrefix\` varchar(255) NOT NULL COMMENT 'Meta space prefix'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` ADD UNIQUE INDEX \`IDX_3bd90d352dcaaf053188ec24fb\` (\`metaSpacePrefix\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` DROP INDEX \`IDX_3bd90d352dcaaf053188ec24fb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`site_config_entity\` CHANGE \`metaSpacePrefix\` \`metaSpacePrefix\` varchar(255) NULL COMMENT 'Meta space prefix'`,
    );
  }
}
