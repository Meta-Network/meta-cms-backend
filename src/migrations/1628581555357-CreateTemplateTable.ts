import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateTable1628581555357 implements MigrationInterface {
  name = 'CreateTemplateTable1628581555357';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `theme_template_entity` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Template id', `templateName` varchar(255) NOT NULL COMMENT 'Template name', `templateType` enum ('HEXO') NOT NULL COMMENT 'Template type', `repoUrl` varchar(255) NOT NULL COMMENT 'Template repo Url', `previewImage` varchar(255) NULL COMMENT 'Preview image', `previewSite` varchar(255) NULL COMMENT 'Preview site', PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );

    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `storeType` `storeType` enum ('GITHUB', 'GITEE') NULL COMMENT 'Site store type'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `storeType` `storeType` enum ('LOCAL', 'GIT', 'IPFS', 'OSS') NULL COMMENT 'Site store type'",
    );

    await queryRunner.query('DROP TABLE `theme_template_entity`');
  }
}
