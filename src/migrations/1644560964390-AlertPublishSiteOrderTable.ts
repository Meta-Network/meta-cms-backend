import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertPublishSiteOrderTable1644560964390
  implements MigrationInterface
{
  name = 'AlertPublishSiteOrderTable1644560964390';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`publish_site_order_entity\` ADD \`state\` varchar(255) NOT NULL COMMENT 'Publish site order state' DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`deploy_site_order_entity\` CHANGE \`id\` \`id\` varchar(255) NOT NULL COMMENT 'Use server signature as deploy site order id.'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` CHANGE \`content\` \`content\` text NOT NULL COMMENT 'Post content' DEFAULT ''`,
    );

    await queryRunner.query(
      `CREATE INDEX \`IDX_8d09d83d44096171cd241d2c54\` ON \`post_order_entity\` (\`postTaskId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_a6cf546f731fec97cd35399053\` ON \`post_order_entity\` (\`publishSiteOrderId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_76040df2f91c5a05318fa17f6e\` ON \`post_order_entity\` (\`publishSiteTaskId\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_76040df2f91c5a05318fa17f6e\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a6cf546f731fec97cd35399053\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8d09d83d44096171cd241d2c54\` ON \`post_order_entity\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`post_metadata_entity\` CHANGE \`content\` \`content\` text NOT NULL COMMENT 'Post content'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`deploy_site_order_entity\` CHANGE \`id\` \`id\` varchar(255) NOT NULL COMMENT 'Use author signature as deploy site order id.'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`publish_site_order_entity\` DROP COLUMN \`state\``,
    );
  }
}
