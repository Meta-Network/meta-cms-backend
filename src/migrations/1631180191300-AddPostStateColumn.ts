import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPostStateColumn1631180191300 implements MigrationInterface {
    name = 'AddPostStateColumn1631180191300'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`state\` enum ('0', '1', '2') NOT NULL COMMENT 'Post state' DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`state\``);
    }

}
