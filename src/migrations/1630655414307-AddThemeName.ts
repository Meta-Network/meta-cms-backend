import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThemeName1630655414307 implements MigrationInterface {
  name = 'AddThemeName1630655414307';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `theme_template_entity` ADD `themeName` varchar(255) NOT NULL COMMENT 'Template theme name'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `theme_template_entity` DROP COLUMN `themeName`',
    );
  }
}
