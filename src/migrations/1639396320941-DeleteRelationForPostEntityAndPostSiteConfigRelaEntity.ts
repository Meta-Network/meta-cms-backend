import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteRelationForPostEntityAndPostSiteConfigRelaEntity1639396320941
  implements MigrationInterface
{
  name = 'DeleteRelationForPostEntityAndPostSiteConfigRelaEntity1639396320941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` DROP FOREIGN KEY \`FK_2588ab635a0cbcac19a6d885ce8\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2588ab635a0cbcac19a6d885ce\` ON \`post_site_config_rela_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` DROP COLUMN \`postId\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` ADD \`postId\` int UNSIGNED NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_2588ab635a0cbcac19a6d885ce\` ON \`post_site_config_rela_entity\` (\`postId\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_site_config_rela_entity\` ADD CONSTRAINT \`FK_2588ab635a0cbcac19a6d885ce8\` FOREIGN KEY (\`postId\`) REFERENCES \`post_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
