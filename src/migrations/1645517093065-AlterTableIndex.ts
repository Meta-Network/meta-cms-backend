import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableIndex1645517093065 implements MigrationInterface {
  name = 'AlterTableIndex1645517093065';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_9c5ab5c617530723b3d1e6fcd5\` ON \`deploy_site_task_entity\` (\`userId\`, \`siteConfigId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_856f8330397eb98d310e9754da\` ON \`publish_site_task_entity\` (\`userId\`, \`siteConfigId\`, \`state\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_856f8330397eb98d310e9754da\` ON \`publish_site_task_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9c5ab5c617530723b3d1e6fcd5\` ON \`deploy_site_task_entity\``,
    );
  }
}
