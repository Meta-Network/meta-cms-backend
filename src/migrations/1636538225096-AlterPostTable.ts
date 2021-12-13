import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostTable1636538225096 implements MigrationInterface {
  name = 'AlterPostTable1636538225096';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` ADD \`authorDigestRequestMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest request metadata storage type' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` ADD \`serverVerificationMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification metadata storage type' DEFAULT 'ipfs'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`serverVerificationMetadataRefer\` \`serverVerificationMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification refer' DEFAULT 'ipfs'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`serverVerificationMetadataRefer\` \`serverVerificationMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification refer' DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` DROP COLUMN \`serverVerificationMetadataStorageType\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` DROP COLUMN \`authorDigestRequestMetadataStorageType\``,
    );
  }
}
