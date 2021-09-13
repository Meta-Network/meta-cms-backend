import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAccessTokenAndPostTable1631531065544
  implements MigrationInterface
{
  name = 'UpdateAccessTokenAndPostTable1631531065544';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_eec87a7c914d313a0c92c68f91\` ON \`meta-cms-dev\`.\`access_token_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`access_token_entity\` ADD \`userId\` int NOT NULL COMMENT 'UCenter user id'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`access_token_entity\` ADD \`active\` tinyint NOT NULL COMMENT 'Is actived for synchronizer'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_fe430c0b8fdcc762bc9b189dbd\` ON \`meta-cms-dev\`.\`access_token_entity\` (\`userId\`, \`active\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_dd8203b41ecad754d791af3611\` ON \`meta-cms-dev\`.\`access_token_entity\` (\`userId\`, \`platform\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_dd8203b41ecad754d791af3611\` ON \`meta-cms-dev\`.\`access_token_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe430c0b8fdcc762bc9b189dbd\` ON \`meta-cms-dev\`.\`access_token_entity\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`access_token_entity\` DROP COLUMN \`active\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meta-cms-dev\`.\`access_token_entity\` DROP COLUMN \`userId\``,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_eec87a7c914d313a0c92c68f91\` ON \`meta-cms-dev\`.\`access_token_entity\` (\`platform\`)`,
    );
  }
}
