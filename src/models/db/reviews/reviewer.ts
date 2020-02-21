import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Review } from "./review";

@Entity()
export class Reviewer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { nullable: true, unique: true })
  authId: string;

  @OneToMany(
    () => Review,
    review => review.reviewer
  )
  reviews: Review[];
}
