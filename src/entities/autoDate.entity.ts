import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';

export abstract class AutoDateEntity {
  @CreateDateColumn()
  @ApiHideProperty()
  @ApiResponseProperty({ example: '2021-07-27T11:39:39.150Z' })
  readonly createdAt: Date;

  @UpdateDateColumn()
  @ApiHideProperty()
  @ApiResponseProperty({ example: '2021-07-27T11:39:39.150Z' })
  readonly updatedAt: Date;
}
