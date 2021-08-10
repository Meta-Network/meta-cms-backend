import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBaseTable1628617354313 implements MigrationInterface {
  name = 'CreateBaseTable1628617354313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` DROP FOREIGN KEY `FK_aa0111b66f3c54e5288dc47ac0e`',
    );
    await queryRunner.query(
      'ALTER TABLE `site_info_entity` CHANGE `id` `id` int UNSIGNED NOT NULL AUTO_INCREMENT',
    );
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` CHANGE `id` `id` int UNSIGNED NOT NULL AUTO_INCREMENT',
    );
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` CHANGE `siteInfoId` `siteInfoId` int UNSIGNED NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `theme_template_entity` CHANGE `id` `id` int UNSIGNED NOT NULL AUTO_INCREMENT',
    );
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` ADD CONSTRAINT `FK_aa0111b66f3c54e5288dc47ac0e` FOREIGN KEY (`siteInfoId`) REFERENCES `site_info_entity`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` DROP FOREIGN KEY `FK_aa0111b66f3c54e5288dc47ac0e`',
    );
    await queryRunner.query(
      "ALTER TABLE `theme_template_entity` CHANGE `id` `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Template id'",
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `siteInfoId` `siteInfoId` int UNSIGNED NULL COMMENT 'Primary key'",
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `id` `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Site config id'",
    );
    await queryRunner.query(
      "ALTER TABLE `site_info_entity` CHANGE `id` `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key'",
    );
    await queryRunner.query(
      'ALTER TABLE `site_config_entity` ADD CONSTRAINT `FK_aa0111b66f3c54e5288dc47ac0e` FOREIGN KEY (`siteInfoId`) REFERENCES `site_info_entity`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }
}
