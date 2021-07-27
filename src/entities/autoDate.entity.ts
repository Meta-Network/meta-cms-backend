import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

export abstract class AutoDateEntity {
  @CreateDateColumn()
  @ApiHideProperty()
  readonly createdAt: Date;

  @UpdateDateColumn()
  @ApiHideProperty()
  readonly updatedAt: Date;
}
