import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMetadataHashColumnToPostEntity1631176465715 implements MigrationInterface {
    name = 'AddMetadataHashColumnToPostEntity1631176465715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`metadataHash\` varchar(255) NOT NULL COMMENT 'Post metadata hash'`);
        }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`metadataHash\``);
    }

}
