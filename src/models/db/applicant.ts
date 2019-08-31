import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { injectable } from "inversify";

@injectable()
@Entity()
export class Applicant {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 128 })
  name: string;
}