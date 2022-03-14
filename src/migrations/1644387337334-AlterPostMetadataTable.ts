import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostMetadataTable1644387337334 implements MigrationInterface {
  name = 'AlterPostMetadataTable1644387337334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`content\` text NOT NULL COMMENT 'Post content'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`content\``,
    );
  }
}
