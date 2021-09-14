import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSynchronizerTable1631610329943 implements MigrationInterface {
  name = 'AddSynchronizerTable1631610329943';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`meta-cms-dev\`.\`synchronizer_entity\` (\`name\` varchar(255) NOT NULL, \`latestTime\` timestamp NOT NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE \`meta-cms-dev\`.\`synchronizer_entity\``,
    );
  }
}
