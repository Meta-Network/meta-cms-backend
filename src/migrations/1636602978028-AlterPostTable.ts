import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostTable1636602978028 implements MigrationInterface {
  name = 'AlterPostTable1636602978028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` ADD \`titleInStorage\` varchar(255) NOT NULL COMMENT 'Post title in storage.For updating title' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` DROP COLUMN \`titleInStorage\``,
    );
  }
}
