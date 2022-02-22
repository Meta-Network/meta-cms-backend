import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableIndex1645435774519 implements MigrationInterface {
  name = 'AlterTableIndex1645435774519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`deploy_site_order_entity\` ADD \`state\` varchar(255) NOT NULL COMMENT 'Deploy site order state' DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_4e5e255a05f1eb26bf4afa690d\` ON \`deploy_site_order_entity\` (\`state\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_450bf5adbba3d01f13149dbe52\` ON \`deploy_site_order_entity\` (\`userId\`, \`siteConfigId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_02240e002a44bb4de34a6b9c7c\` ON \`publish_site_order_entity\` (\`publishSiteTaskId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_e71e8afabf1c1e714a2e081342\` ON \`publish_site_order_entity\` (\`state\`, \`userId\`, \`siteConfigId\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_e71e8afabf1c1e714a2e081342\` ON \`publish_site_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_02240e002a44bb4de34a6b9c7c\` ON \`publish_site_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_450bf5adbba3d01f13149dbe52\` ON \`deploy_site_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4e5e255a05f1eb26bf4afa690d\` ON \`deploy_site_order_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`deploy_site_order_entity\` DROP COLUMN \`state\``,
    );
  }
}
