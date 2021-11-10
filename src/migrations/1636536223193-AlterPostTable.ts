import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterPostTable1636536223193 implements MigrationInterface {
    name = 'AlterPostTable1636536223193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`authorDigestRequestMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest request refer' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`serverVerificationMetadataRefer\` varchar(255) NOT NULL COMMENT 'Post author digest sign with content server verification refer' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`authorPublicKey\` varchar(255) NOT NULL COMMENT 'Post author public key' DEFAULT ''`);
        await queryRunner.query(`DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'site_published', 'ignored', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX \`IDX_f8b76bfd81c1c148eee0fbe5d1\` ON \`meta-cms-dev\`.\`post_entity\` (\`authorPublicKey\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\` (\`userId\`, \`state\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`DROP INDEX \`IDX_f8b76bfd81c1c148eee0fbe5d1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'ignored', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\` (\`userId\`, \`state\`)`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`authorPublicKey\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`serverVerificationMetadataRefer\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`authorDigestRequestMetadataRefer\``);
    }

}
