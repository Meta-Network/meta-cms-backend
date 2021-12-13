import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDraft1634197178529 implements MigrationInterface {
  name = 'AddDraft1634197178529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`draft_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id', \`content\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'ignored', 'drafted') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'ignored') NOT NULL COMMENT 'Post state' DEFAULT ''pending''`,
    );
    await queryRunner.query(`DROP TABLE \`draft_entity\``);
  }
}
