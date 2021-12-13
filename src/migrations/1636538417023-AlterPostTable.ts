import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostTable1636538417023 implements MigrationInterface {
  name = 'AlterPostTable1636538417023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`authorDigestRequestMetadataStorageType\` \`authorDigestRequestMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest request metadata storage type' DEFAULT 'ipfs'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`serverVerificationMetadataRefer\` \`serverVerificationMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification refer' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`serverVerificationMetadataRefer\` \`serverVerificationMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification refer' DEFAULT 'ipfs'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`authorDigestRequestMetadataStorageType\` \`authorDigestRequestMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest request metadata storage type' DEFAULT ''`,
    );
  }
}
