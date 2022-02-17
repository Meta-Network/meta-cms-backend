import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostMetadataTable1645085103462 implements MigrationInterface {
  name = 'AlterPostMetadataTable1645085103462';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`cover\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`cover\` varchar(1024) NOT NULL COMMENT 'Post cover' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`summary\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`summary\` varchar(1000) NOT NULL COMMENT 'Post summary' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`categories\` varchar(1000) NULL COMMENT 'Post categories'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`tags\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`tags\` varchar(1000) NULL COMMENT 'Post tags'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`server_verification_entity\` CHANGE \`payload\` \`payload\` text NOT NULL COMMENT 'server verification payload' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`server_verification_entity\` CHANGE \`payload\` \`payload\` text NOT NULL COMMENT 'server verification payload'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`tags\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`tags\` varchar(255) NULL COMMENT 'Post tags'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`categories\` varchar(255) NULL COMMENT 'Post categories'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`summary\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`summary\` varchar(255) NOT NULL COMMENT 'Post summary' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` DROP COLUMN \`cover\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` ADD \`cover\` varchar(255) NOT NULL COMMENT 'Post cover' DEFAULT ''`,
    );
  }
}
