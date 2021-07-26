import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class AutoDate {
  @CreateDateColumn()
  readonly createdAt: Date;

  @UpdateDateColumn()
  readonly updatedAt: Date;
}
