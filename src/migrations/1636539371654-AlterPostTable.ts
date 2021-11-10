import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterPostTable1636539371654 implements MigrationInterface {
    name = 'AlterPostTable1636539371654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`authorDigestRequestMetadataStorageType\` \`authorDigestRequestMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest request metadata storage type' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`serverVerificationMetadataStorageType\` \`serverVerificationMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification metadata storage type' DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`serverVerificationMetadataStorageType\` \`serverVerificationMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification metadata storage type' DEFAULT 'ipfs'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`authorDigestRequestMetadataStorageType\` \`authorDigestRequestMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest request metadata storage type' DEFAULT 'ipfs'`);
    }

}
