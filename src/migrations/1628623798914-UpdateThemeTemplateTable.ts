import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateThemeTemplateTable1628623798914
  implements MigrationInterface
{
  name = 'UpdateThemeTemplateTable1628623798914';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `theme_template_entity` ADD `branchName` varchar(255) NOT NULL COMMENT 'Template repo branch name'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `theme_template_entity` DROP COLUMN `branchName`',
    );
  }
}
