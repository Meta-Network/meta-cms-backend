import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostCategoryAndTagsColumns1631515610000
  implements MigrationInterface
{
  name = 'AddPostCategoryAndTagsColumns1631515610000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`category\` varchar(255) NULL COMMENT 'Post category'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`tags\` text NULL COMMENT 'Post tags'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`tags\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`category\``,
    );
  }
}
