import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableIndex1645524979075 implements MigrationInterface {
  name = 'AlterTableIndex1645524979075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_fac79c285cf3dd71ad8a334ffb\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_4c7b6fe490c4d25682c6aec138\` ON \`post_order_entity\` (\`submitState\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_8d09d83d44096171cd241d2c54\` ON \`post_order_entity\` (\`postTaskId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_fac79c285cf3dd71ad8a334ffb\` ON \`post_order_entity\` (\`userId\`, \`submitState\`, \`publishState\`, \`certificateState\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_fac79c285cf3dd71ad8a334ffb\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8d09d83d44096171cd241d2c54\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4c7b6fe490c4d25682c6aec138\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_fac79c285cf3dd71ad8a334ffb\` ON \`post_order_entity\` (\`userId\`, \`submitState\`, \`publishState\`, \`certificateStorageType\`)`,
    );
  }
}
