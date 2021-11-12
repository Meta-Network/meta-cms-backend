import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterSiteConfigTable1636711027722 implements MigrationInterface {
    name = 'AlterSiteConfigTable1636711027722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` ADD \`lastPublishedAt\` datetime NOT NULL COMMENT 'Site last published at'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meta-cms-dev\`.\`site_config_entity\` DROP COLUMN \`lastPublishedAt\``);
    }

}
