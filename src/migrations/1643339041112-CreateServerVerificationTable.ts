import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServerVerificationTable1643339041112
  implements MigrationInterface
{
  name = 'CreateServerVerificationTable1643339041112';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`server_verification_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Use server verification signature as server verification entity id.' DEFAULT '', \`payload\` varchar(255) NOT NULL COMMENT 'server verification payload' DEFAULT '', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`server_verification_entity\``);
  }
}
