import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatatakiSyncTable1631616552906 implements MigrationInterface {
  name = 'AddMatatakiSyncTable1631616552906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`matataki_sync_entity\` (\`userId\` int NOT NULL, \`latestTime\` timestamp NOT NULL, PRIMARY KEY (\`userId\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`matataki_sync_entity\``);
  }
}
