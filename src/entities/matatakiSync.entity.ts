import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class MatatakiSyncEntity {
  @PrimaryColumn()
  userId: number;

  @Column({ type: 'timestamp' })
  latestTime: Date;
}
