import { IsInt, IsNotEmpty, IsString } from "class-validator";
import { Column, Entity } from "typeorm";

import { BaseEntity } from "./base.entity";

@Entity()
export class PostEntity extends BaseEntity {
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Column({ comment: 'Post title'})
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ comment: 'Post content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @Column({ comment: 'Post metadata hash' })
  @IsString()
  @IsNotEmpty()
  metadataHash: string;
}