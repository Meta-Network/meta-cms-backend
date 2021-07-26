import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDataTable1627299385278 implements MigrationInterface {
  name = 'CreateDataTable1627299385278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `site_info` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key', `userId` int NOT NULL COMMENT 'UCenter user id', `title` varchar(255) NOT NULL COMMENT 'Site title', `subtitle` varchar(255) NOT NULL COMMENT 'Site subtitle' DEFAULT '', `description` text NOT NULL COMMENT 'Site description' DEFAULT '', `author` varchar(255) NOT NULL COMMENT 'Site author' DEFAULT '', `keywords` text NULL COMMENT 'Site keywords', `favicon` varchar(255) NOT NULL COMMENT 'Site favicon link' DEFAULT '', PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );
    await queryRunner.query(
      "CREATE TABLE `site_config` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Site config id', `language` varchar(255) NOT NULL COMMENT 'Site language' DEFAULT 'en-US', `timezone` varchar(255) NOT NULL COMMENT 'Site timezone' DEFAULT '', `theme` varchar(255) NOT NULL COMMENT 'Site theme' DEFAULT '', `domain` varchar(255) NOT NULL COMMENT 'Site domain' DEFAULT '', `storeType` enum ('LOCAL', 'GIT', 'IPFS', 'OSS') NULL COMMENT 'Site store type', `storeProviderId` int NULL COMMENT 'Site store provider id', `cicdType` enum ('GITHUB', 'GITLAB', 'JENKINS', 'AZDO', 'CIRCLE') NULL COMMENT 'Site cicd type', `cicdProviderId` int NULL COMMENT 'Site cicd provider id', `publisherType` enum ('GITHUB', 'GITLAB', 'CLOUDFLARE', 'VERCEL') NULL COMMENT 'Site publisher type', `publisherProviderId` int NULL COMMENT 'Site publisher provider id', `cdnType` enum ('CLOUDFLARE') NULL COMMENT 'Site cdn type', `cdnProviderId` int NULL COMMENT 'Site cdn provider id', `siteInfoId` int UNSIGNED NULL COMMENT 'Primary key', PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );
    await queryRunner.query(
      'ALTER TABLE `site_config` ADD CONSTRAINT `FK_6587d05d7ad3ddec6a7f56a973b` FOREIGN KEY (`siteInfoId`) REFERENCES `site_info`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `site_config` DROP FOREIGN KEY `FK_6587d05d7ad3ddec6a7f56a973b`',
    );
    await queryRunner.query('DROP TABLE `site_config`');
    await queryRunner.query('DROP TABLE `site_info`');
  }
}
