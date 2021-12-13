import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvalidPostState1634718871412 implements MigrationInterface {
  name = 'AddInvalidPostState1634718871412';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'ignored', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'published', 'ignored', 'drafted') NOT NULL COMMENT 'Post state' DEFAULT ''pending''`,
    );
  }
}
