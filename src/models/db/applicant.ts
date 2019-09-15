import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Min, IsDefined, IsInt, IsNotEmpty, IsOptional, IsDate } from "class-validator";

@Entity()
export class Applicant {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants name is required" })
  name: string;

  @Column("integer")
  @IsDefined({ message: "The applicants age is required" })
  @IsInt()
  @Min(1, { message: "Minimum age is 1" })
  age: number;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants gender is required" })
  gender: string;

  @Column("varchar", { nullable: true })
  @IsOptional()
  nationality: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants country of origin is required" })
  country: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants city is required" })
  city: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants university is required" })
  university: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants year of study is required" })
  yearOfStudy: string;

  @Column("varchar", { nullable: true })
  @IsOptional()
  cv: string;

  @Column("varchar", { nullable: true })
  @IsOptional()
  workArea: string;

  @Column("varchar", { nullable: true })
  @IsOptional()
  skills: string;

  @Column("integer", { nullable: true })
  @IsInt()
  @Min(0, { message: "Minimum number of hackathons is zero" })
  @IsOptional()
  hackathonCount: number;

  @Column("text", { nullable: true })
  @IsOptional()
  whyChooseHacker: string;

  @Column("text", { nullable: true })
  @IsOptional()
  pastProjects: string;

  @Column("text", { nullable: true })
  @IsOptional()
  hardwareRequests: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants dietary requirement is required" })
  dietaryRequirements: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants T-Shirt size is required" })
  tShirtSize: string;

  @Column("datetime")
  createdAt: Date;
}
