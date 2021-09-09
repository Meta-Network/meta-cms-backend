import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAccessTokenAndPostEntityTables1631173892514 implements MigrationInterface {
    name = 'AddAccessTokenAndPostEntityTables1631173892514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`meta-cms-dev\`.\`access_token_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`platform\` varchar(255) NOT NULL COMMENT 'Platform', \`accessToken\` varchar(255) NOT NULL COMMENT 'Access token', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`meta-cms-dev\`.\`post_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id', \`title\` varchar(255) NOT NULL COMMENT 'Post title', \`content\` varchar(255) NOT NULL COMMENT 'Post content', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`meta-cms-dev\`.\`post_entity\``);
        await queryRunner.query(`DROP TABLE \`meta-cms-dev\`.\`access_token_entity\``);
    }

}
