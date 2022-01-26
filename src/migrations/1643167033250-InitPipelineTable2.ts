import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPipelineTable21643167033250 implements MigrationInterface {
  name = 'InitPipelineTable21643167033250';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`deploy_site_order_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Use author signature as deploy site order id.', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0', \`siteConfigId\` int NOT NULL COMMENT 'Site config id' DEFAULT '0', \`serverVerificationId\` varchar(255) NOT NULL COMMENT 'Use server verification signature as server verification id.' DEFAULT '', \`deploySiteTaskId\` varchar(255) NOT NULL COMMENT 'Deploy site task id' DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`deploy_site_task_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Publish site task id', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0', \`siteConfigId\` int NOT NULL COMMENT 'Site config id' DEFAULT '0', \`state\` varchar(255) NOT NULL COMMENT 'Task state' DEFAULT 'pending', \`workerName\` varchar(255) NOT NULL COMMENT 'The name of the worker assigned to handle this task' DEFAULT '', \`workerSecret\` varchar(255) NOT NULL COMMENT 'Worker auth' DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_metadata_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Post metadata id. Use author signature as id', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`title\` varchar(255) NOT NULL COMMENT 'Post title' DEFAULT '', \`cover\` varchar(255) NOT NULL COMMENT 'Post cover' DEFAULT '', \`summary\` varchar(255) NOT NULL COMMENT 'Post summary' DEFAULT '', \`categories\` text NULL COMMENT 'Post categories', \`tags\` varchar(255) NULL COMMENT 'Post tags', \`license\` varchar(255) NOT NULL COMMENT 'Post license' DEFAULT '', \`authorPublicKey\` varchar(255) NOT NULL COMMENT 'Post author public key' DEFAULT '', INDEX \`IDX_b2958c1dab74f7ad5df194efff\` (\`authorPublicKey\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_order_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Use author signature as post metadata id.', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0', \`submitState\` varchar(255) NOT NULL COMMENT 'Submit state' DEFAULT 'pending', \`publishState\` varchar(255) NOT NULL COMMENT 'Publish state' DEFAULT 'pending', \`serverVerificationId\` varchar(255) NOT NULL COMMENT 'Use server verification signature as server verification id.' DEFAULT '', \`certificateStorageType\` varchar(255) NOT NULL COMMENT 'Use server verification as certificate.Use permweb as storage' DEFAULT '', \`certificateId\` varchar(255) NOT NULL COMMENT 'Use Arweave tx id / IPFS CID / ... as certifcate id' DEFAULT '', \`certificateState\` varchar(255) NOT NULL COMMENT 'Certificate state' DEFAULT '', \`postTaskId\` varchar(255) NOT NULL COMMENT 'The id of the task to process this order. Many to one' DEFAULT '', \`publishSiteOrderId\` int NOT NULL COMMENT 'The id of the order to publish site for this post. Many to one' DEFAULT '0', \`publishSiteTaskId\` varchar(255) NOT NULL COMMENT 'The id oft the task to publish site for this post. Many to one' DEFAULT '', INDEX \`IDX_fac79c285cf3dd71ad8a334ffb\` (\`userId\`, \`publishState\`, \`submitState\`, \`certificateState\`), UNIQUE INDEX \`REL_941017380ff88f3b709a0cf484\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_task_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Post task id', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0', \`state\` varchar(255) NOT NULL COMMENT 'Task state' DEFAULT 'pending', \`workerName\` varchar(255) NOT NULL COMMENT 'The name of the worker assigned to handle this task' DEFAULT '', \`workerSecret\` varchar(255) NOT NULL COMMENT 'Worker auth' DEFAULT '', \`publishSiteOrderId\` int NOT NULL COMMENT 'Publish site order id' DEFAULT '0', \`publishSiteTaskId\` varchar(255) NOT NULL COMMENT 'Publish site task id' DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`publish_site_order_entity\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0', \`siteConfigId\` int NOT NULL COMMENT 'Site config id' DEFAULT '0', \`serverVerificationId\` varchar(255) NOT NULL COMMENT 'Use server verification signature as server verification id.' DEFAULT '', \`publishSiteTaskId\` varchar(255) NOT NULL COMMENT 'Publish site task id' DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`publish_site_task_entity\` (\`id\` varchar(255) NOT NULL COMMENT 'Publish site task id', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL COMMENT 'UCenter user id' DEFAULT '0', \`siteConfigId\` int NOT NULL COMMENT 'Site config id' DEFAULT '0', \`state\` varchar(255) NOT NULL COMMENT 'Task state' DEFAULT 'pending', \`workerName\` varchar(255) NOT NULL COMMENT 'The name of the worker assigned to handle this task' DEFAULT '', \`workerSecret\` varchar(255) NOT NULL COMMENT 'Worker auth' DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_order_entity\` ADD CONSTRAINT \`FK_941017380ff88f3b709a0cf484a\` FOREIGN KEY (\`id\`) REFERENCES \`post_metadata_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post_order_entity\` DROP FOREIGN KEY \`FK_941017380ff88f3b709a0cf484a\``,
    );
    await queryRunner.query(`DROP TABLE \`publish_site_task_entity\``);
    await queryRunner.query(`DROP TABLE \`publish_site_order_entity\``);
    await queryRunner.query(`DROP TABLE \`post_task_entity\``);
    await queryRunner.query(
      `DROP INDEX \`REL_941017380ff88f3b709a0cf484\` ON \`post_order_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fac79c285cf3dd71ad8a334ffb\` ON \`post_order_entity\``,
    );
    await queryRunner.query(`DROP TABLE \`post_order_entity\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b2958c1dab74f7ad5df194efff\` ON \`post_metadata_entity\``,
    );
    await queryRunner.query(`DROP TABLE \`post_metadata_entity\``);
    await queryRunner.query(`DROP TABLE \`deploy_site_task_entity\``);
    await queryRunner.query(`DROP TABLE \`deploy_site_order_entity\``);
  }
}
