import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostSiteConfigRelaTable1633679864268
  implements MigrationInterface
{
  name = 'CreatePostSiteConfigRelaTable1633679864268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`post_site_config_rela_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`postId\` int NOT NULL COMMENT 'post id', \`siteConfigId\` int NOT NULL COMMENT 'site config id', \`state\` enum ('TODO', 'DOING', 'SUCCESS', 'FAIL') NOT NULL COMMENT 'Post publish state' DEFAULT 'TODO', INDEX \`IDX_2588ab635a0cbcac19a6d885ce\` (\`postId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_2588ab635a0cbcac19a6d885ce\` ON \`post_site_config_rela_entity\``,
    );
    await queryRunner.query(`DROP TABLE \`post_site_config_rela_entity\``);
  }
}
