import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixThemeEntityTypo1631258959655 implements MigrationInterface {
  name = 'FixThemeEntityTypo1631258959655';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`theme_entity\` CHANGE \`templateBranch\` \`themeBranch\` varchar(255) NOT NULL COMMENT 'Theme repo branch name'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_entity\` CHANGE \`themeRepo\` \`themeRepo\` varchar(255) NOT NULL COMMENT 'Theme repo Url'`,
    );
    // await queryRunner.query(
    //   `ALTER TABLE \`theme_entity\` DROP COLUMN \`themeBranch\``,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE \`theme_entity\` ADD \`themeBranch\` varchar(255) NOT NULL COMMENT 'Theme repo branch name'`,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(
    //   `ALTER TABLE \`theme_entity\` DROP COLUMN \`themeBranch\``,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE \`theme_entity\` ADD \`themeBranch\` varchar(255) NOT NULL COMMENT 'Template repo branch name'`,
    // );
    await queryRunner.query(
      `ALTER TABLE \`theme_entity\` CHANGE \`themeRepo\` \`themeRepo\` varchar(255) NOT NULL COMMENT 'Template repo Url'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_entity\` CHANGE \`themeBranch\` \`templateBranch\` varchar(255) NOT NULL COMMENT 'Template repo branch name'`,
    );
  }
}
