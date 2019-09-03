import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Min, IsDefined, IsInt, IsNotEmpty, MaxLength } from "class-validator";

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
  @Min(1, { message: "Minimum age is 0"})
  age: number;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants gender is required" })
  gender: string;

  @Column("varchar")
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

  @Column("varchar")
  workArea: string;

  @Column("varchar")
  skills: string;

  @Column("integer")
  @IsInt()
  @Min(0, { message: "Minimum number of hackathons is zero"})
  hackathonCount: number;

  @Column("text")
  whyChooseHacker: string;

  @Column("text")
  pastProjects: string;

  @Column("text")
  hardwareRequests: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants dietary requirement is required" })
  dietaryRequirements: string;

  @Column("varchar")
  @IsNotEmpty({ message: "The applicants T-Shirt size is required" })
  tShirtSize: string;

}
