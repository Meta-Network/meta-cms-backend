import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class SynchronizerEntity {
  @PrimaryColumn()
  name: string;

  @Column({ type: 'timestamp' })
  latestTime: Date;
}
