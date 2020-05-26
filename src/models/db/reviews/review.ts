import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Applicant } from "../applicant";

@Entity()
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Applicant)
  applicant: Applicant;

  @Column()
  createdByAuthID: string;

  @Column()
  averageScore: number;

  @Column("datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
