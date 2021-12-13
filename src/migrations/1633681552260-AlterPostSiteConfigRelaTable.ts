import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostSiteConfigRelaTable1633681552260
  implements MigrationInterface
{
  name = 'AlterPostSiteConfigRelaTable1633681552260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` CHANGE \`postId\` \`postId\` int UNSIGNED NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` CHANGE \`siteConfigId\` \`siteConfigId\` int UNSIGNED NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` ADD CONSTRAINT \`FK_2588ab635a0cbcac19a6d885ce8\` FOREIGN KEY (\`postId\`) REFERENCES \`post_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` ADD CONSTRAINT \`FK_f0ecf8914abae3307e744e41769\` FOREIGN KEY (\`siteConfigId\`) REFERENCES \`site_config_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` DROP FOREIGN KEY \`FK_f0ecf8914abae3307e744e41769\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` DROP FOREIGN KEY \`FK_2588ab635a0cbcac19a6d885ce8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` CHANGE \`siteConfigId\` \`siteConfigId\` int NOT NULL COMMENT 'site config id'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` CHANGE \`postId\` \`postId\` int NOT NULL COMMENT 'post id'`,
    );
  }
}
