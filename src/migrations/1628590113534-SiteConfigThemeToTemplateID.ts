import { MigrationInterface, QueryRunner } from 'typeorm';

export class SiteConfigThemeToTemplateID1628590113534
  implements MigrationInterface
{
  name = 'SiteConfigThemeToTemplateID1628590113534';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `theme` `templateId` varchar(255) NOT NULL COMMENT 'Site theme' DEFAULT ''",
    );
    await queryRunner.query(
      "ALTER TABLE `site_info_entity` CHANGE `description` `description` text NOT NULL COMMENT 'Site description' DEFAULT ''",
    );
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` DROP COLUMN `templateId`',
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` ADD `templateId` int NULL COMMENT 'Site theme template id'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` DROP COLUMN `templateId`',
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` ADD `templateId` varchar(255) NOT NULL COMMENT 'Site theme' DEFAULT ''",
    );
    await queryRunner.query(
      "ALTER TABLE `site_info_entity` CHANGE `description` `description` text NOT NULL COMMENT 'Site description'",
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `templateId` `theme` varchar(255) NOT NULL COMMENT 'Site theme' DEFAULT ''",
    );
  }
}
