import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformUsernameColumn1639664451486
  implements MigrationInterface
{
  name = 'AddPlatformUsernameColumn1639664451486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`access_token_entity\` ADD \`username\` varchar(255) NOT NULL COMMENT 'Platform username' DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`access_token_entity\` DROP COLUMN \`username\``,
    );
  }
}
