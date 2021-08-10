import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumTypes1628621964907 implements MigrationInterface {
  name = 'UpdateEnumTypes1628621964907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `cicdType` `cicdType` enum ('GITHUB', 'GITEE', 'GITLAB', 'JENKINS', 'AZDO', 'CIRCLE') NULL COMMENT 'Site cicd type'",
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `publisherType` `publisherType` enum ('GITHUB', 'GITEE', 'GITLAB', 'CLOUDFLARE', 'VERCEL') NULL COMMENT 'Site publisher type'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `publisherType` `publisherType` enum ('GITHUB', 'GITLAB', 'CLOUDFLARE', 'VERCEL') NULL COMMENT 'Site publisher type'",
    );
    await queryRunner.query(
      "ALTER TABLE `site_config_entity` CHANGE `cicdType` `cicdType` enum ('GITHUB', 'GITLAB', 'JENKINS', 'AZDO', 'CIRCLE') NULL COMMENT 'Site cicd type'",
    );
  }
}
