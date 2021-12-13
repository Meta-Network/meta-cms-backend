import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateDescription1631102132416 implements MigrationInterface {
  name = 'AddTemplateDescription1631102132416';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_39661e4aee7cc18de152865ffb\` ON \`theme_template_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` ADD \`templateDescription\` varchar(255) NOT NULL COMMENT 'Template description' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`theme_template_entity\` DROP COLUMN \`templateDescription\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_39661e4aee7cc18de152865ffb\` ON \`theme_template_entity\` (\`themeId\`)`,
    );
  }
}
