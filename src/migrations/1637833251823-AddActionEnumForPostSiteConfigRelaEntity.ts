import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActionEnumForPostSiteConfigRelaEntity1637833251823
  implements MigrationInterface
{
  name = 'AddActionEnumForPostSiteConfigRelaEntity1637833251823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` ADD \`action\` enum ('CREATE', 'UPDATE', 'DELETE') NOT NULL COMMENT 'Post action' DEFAULT 'CREATE'`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`post_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'pending_edit', 'published', 'site_published', 'ignored', 'deleted', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`post_entity\` (\`userId\`, \`state\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`post_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_entity\` CHANGE \`state\` \`state\` enum ('pending', 'pending_edit', 'published', 'site_published', 'ignored', 'drafted', 'invalid') NOT NULL COMMENT 'Post state' DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_f6d3b5f011b5150ade6d1835a1\` ON \`post_entity\` (\`userId\`, \`state\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` DROP COLUMN \`action\``,
    );
  }
}
