import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterPostTable1636621092169 implements MigrationInterface {
    name = 'AlterPostTable1636621092169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'pending_edit', 'published', 'site_published', 'ignored', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\` (\`userId\`, \`state\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'site_published', 'ignored', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`meta-cms-dev\`.\`post_entity\` (\`userId\`, \`state\`)`);
    }

}
