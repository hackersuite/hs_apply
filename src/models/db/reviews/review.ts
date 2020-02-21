import { Entity, Column, ManyToOne } from "typeorm";
import { Applicant } from "../applicant";
import { Reviewer } from "./reviewer";

@Entity()
export class Review {
  @ManyToOne(() => Applicant, { primary: true })
  applicant: Applicant;

  @ManyToOne(() => Reviewer, { primary: true })
  reviewer: Reviewer;

  @Column()
  averageScore: number;

  @Column("datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
