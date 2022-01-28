import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterServerVerificationTable1643375976740
  implements MigrationInterface
{
  name = 'AlterServerVerificationTable1643375976740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`server_verification_entity\` DROP COLUMN \`payload\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`server_verification_entity\` ADD \`payload\` text NOT NULL COMMENT 'server verification payload' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`server_verification_entity\` DROP COLUMN \`payload\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`server_verification_entity\` ADD \`payload\` varchar(255) NOT NULL COMMENT 'server verification payload' DEFAULT ''`,
    );
  }
}
