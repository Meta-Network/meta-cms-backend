import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCategoryToCategories1634021334195
  implements MigrationInterface
{
  name = 'ChangeCategoryToCategories1634021334195';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`category\` \`categories\` varchar(255) NULL COMMENT 'Post category'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`categories\` text NULL COMMENT 'Post categories'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` DROP COLUMN \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` ADD \`categories\` varchar(255) NULL COMMENT 'Post category'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`post_entity\` CHANGE \`categories\` \`category\` varchar(255) NULL COMMENT 'Post category'`,
    );
  }
}
