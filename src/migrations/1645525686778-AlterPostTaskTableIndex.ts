import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostTaskTableIndex1645525686778
  implements MigrationInterface
{
  name = 'AlterPostTaskTableIndex1645525686778';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_badd1b41f8ecf9e7c6e900f5a0\` ON \`post_task_entity\` (\`publishSiteOrderId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_90bef99cb04327f230dad14566\` ON \`post_task_entity\` (\`publishSiteTaskId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_c1a32bd0c8cbab28122e0c9091\` ON \`post_task_entity\` (\`userId\`, \`state\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_c1a32bd0c8cbab28122e0c9091\` ON \`post_task_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_90bef99cb04327f230dad14566\` ON \`post_task_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_badd1b41f8ecf9e7c6e900f5a0\` ON \`post_task_entity\``,
    );
  }
}
