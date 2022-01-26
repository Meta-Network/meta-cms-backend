import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostMetadataTable1643182734343 implements MigrationInterface {
  name = 'AlterPostMetadataTable1643182734343';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`digest\` varchar(255) NOT NULL COMMENT 'Post digest' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`categories\` varchar(255) NULL COMMENT 'Post categories'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_0263d60f1069e7b993aac8256b\` ON \`post_metadata_entity\` (\`digest\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_0263d60f1069e7b993aac8256b\` ON \`post_metadata_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`categories\` text NULL COMMENT 'Post categories'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`digest\``,
    );
  }
}
