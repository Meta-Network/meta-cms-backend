import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccessTokenAndPostTable1631511730192
  implements MigrationInterface
{
  name = 'AddAccessTokenAndPostTable1631511730192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`access_token_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`platform\` varchar(255) NOT NULL COMMENT 'Platform', \`accessToken\` varchar(255) NOT NULL COMMENT 'Access token', INDEX \`IDX_eec87a7c914d313a0c92c68f91\` (\`platform\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id', \`title\` varchar(255) NOT NULL COMMENT 'Post title', \`cover\` varchar(255) NULL COMMENT 'Post cover', \`summary\` varchar(255) NULL COMMENT 'Post summary', \`platform\` varchar(255) NOT NULL COMMENT 'Source platform', \`source\` varchar(255) NOT NULL COMMENT 'Post source', \`state\` enum ('pending', 'published', 'ignored') NOT NULL COMMENT 'Post state' DEFAULT 'pending', INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` (\`userId\`, \`state\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`post_entity\``,
    );
    await queryRunner.query(`DROP TABLE \`post_entity\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_eec87a7c914d313a0c92c68f91\` ON \`access_token_entity\``,
    );
    await queryRunner.query(`DROP TABLE \`access_token_entity\``);
  }
}
