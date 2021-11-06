import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterPostTable1636189770599 implements MigrationInterface {
    name = 'AlterPostTable1636189770599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`license\` varchar(255) NOT NULL COMMENT 'Post license' DEFAULT ''`);
        await queryRunner.query(`DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`userId\` \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`title\` \`title\` varchar(255) NOT NULL COMMENT 'Post title' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`cover\` \`cover\` varchar(255) NOT NULL COMMENT 'Post cover' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`summary\` \`summary\` varchar(255) NOT NULL COMMENT 'Post summary' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`platform\` \`platform\` varchar(255) NOT NULL COMMENT 'Source platform' DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`source\` \`source\` varchar(255) NOT NULL COMMENT 'Post source' DEFAULT ''`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\` (\`userId\`, \`state\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`source\` \`source\` varchar(255) NOT NULL COMMENT 'Post source'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`platform\` \`platform\` varchar(255) NOT NULL COMMENT 'Source platform'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`summary\` \`summary\` varchar(255) NULL COMMENT 'Post summary'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`cover\` \`cover\` varchar(255) NULL COMMENT 'Post cover'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`title\` \`title\` varchar(255) NOT NULL COMMENT 'Post title'`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`userId\` \`userId\` int NOT NULL COMMENT 'UCenter user id'`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\` (\`userId\`, \`state\`)`);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`license\``);
    }

}
