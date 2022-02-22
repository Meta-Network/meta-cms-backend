import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableIndex1645524417927 implements MigrationInterface {
  name = 'AlterTableIndex1645524417927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_8d09d83d44096171cd241d2c54\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_6fa5d34e3791d5231f7cb1205e\` ON \`deploy_site_order_entity\` (\`deploySiteTaskId\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_6fa5d34e3791d5231f7cb1205e\` ON \`deploy_site_order_entity\``,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_8d09d83d44096171cd241d2c54\` ON \`post_order_entity\` (\`postTaskId\`)`,
    );
  }
}
