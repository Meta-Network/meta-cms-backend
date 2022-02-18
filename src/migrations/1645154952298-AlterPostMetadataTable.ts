import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostMetadataTable1645154952298 implements MigrationInterface {
  name = 'AlterPostMetadataTable1645154952298';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` CHANGE \`categories\` \`categories\` varchar(1000) NOT NULL COMMENT 'Post categories' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` CHANGE \`tags\` \`tags\` varchar(1000) NOT NULL COMMENT 'Post tags' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` CHANGE \`tags\` \`tags\` varchar(1000) NULL COMMENT 'Post tags'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` CHANGE \`categories\` \`categories\` varchar(1000) NULL COMMENT 'Post categories'`,
    );
  }
}
