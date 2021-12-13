import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterThemeTemplateTable1636539873987
  implements MigrationInterface
{
  name = 'AlterThemeTemplateTable1636539873987';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`enabled\` tinyint NOT NULL COMMENT 'Template enabled' DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`enabled\``,
    );
  }
}
