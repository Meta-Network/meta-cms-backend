import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class AutoDateEntity {
  @CreateDateColumn()
  readonly createdAt: Date;

  @UpdateDateColumn()
  readonly updatedAt: Date;
}
