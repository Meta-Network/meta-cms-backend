import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThemeEntity1631099967330 implements MigrationInterface {
  name = 'AddThemeEntity1631099967330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`theme_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`themeName\` varchar(255) NOT NULL COMMENT 'Theme name', \`themeRepo\` varchar(255) NOT NULL COMMENT 'Template repo Url', \`templateBranch\` varchar(255) NOT NULL COMMENT 'Template repo branch name', \`themeType\` enum ('HEXO') NOT NULL COMMENT 'Theme type', \`isPackage\` tinyint NOT NULL COMMENT 'This theme is npm package' DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`repoUrl\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`branchName\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`themeName\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`templateRepo\` varchar(255) NOT NULL COMMENT 'Template repo Url'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`templateBranch\` varchar(255) NOT NULL COMMENT 'Template repo branch name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`themeId\` int UNSIGNED NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD UNIQUE INDEX \`IDX_39661e4aee7cc18de152865ffb\` (\`themeId\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_39661e4aee7cc18de152865ffb\` ON \`theme_template_entity\` (\`themeId\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD CONSTRAINT \`FK_39661e4aee7cc18de152865ffbb\` FOREIGN KEY (\`themeId\`) REFERENCES \`theme_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP FOREIGN KEY \`FK_39661e4aee7cc18de152865ffbb\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_39661e4aee7cc18de152865ffb\` ON \`theme_template_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP INDEX \`IDX_39661e4aee7cc18de152865ffb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`themeId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`templateBranch\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`templateRepo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`themeName\` varchar(255) NOT NULL COMMENT 'Template theme name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`branchName\` varchar(255) NOT NULL COMMENT 'Template repo branch name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`repoUrl\` varchar(255) NOT NULL COMMENT 'Template repo Url'`,
    );
    await queryRunner.query(`DROP TABLE \`theme_entity\``);
  }
}
