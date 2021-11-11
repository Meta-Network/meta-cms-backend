import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterPostTable1636625684339 implements MigrationInterface {
    name = 'AlterPostTable1636625684339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`authorDigestSignatureMetadataStorageType\` varchar(255) NOT NULL COMMENT 'Post author digest signature metadata storage type' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`authorDigestSignatureMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest signature metadata refer' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`authorDigestRequestMetadataRefer\` \`authorDigestRequestMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest request metadata refer' DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`authorDigestRequestMetadataRefer\` \`authorDigestRequestMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest request refer' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`authorDigestSignatureMetadataRefer\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`authorDigestSignatureMetadataStorageType\``);
    }

}
