import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Min, IsDefined, IsInt, IsNotEmpty, IsOptional, IsDate } from "class-validator";
import { ApplicantStatus } from "../../services/applications/applicantStatus";

@Entity()
export class Applicant {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { nullable: true, unique: true })
  @IsOptional()
  authId: string;

  @Column("integer")
  @IsDefined({ message: "The applicants age is required" })
  @IsInt()
  @Min(18, { message: "Minimum age is 18" })
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

  @Column("datetime", { nullable: true })
  @IsOptional()
  inviteAcceptDeadline: Date;

  // Applicant status, refers to the Enum ApplicationStatus
  @Column({
    type: "enum",
    enum: ApplicantStatus,
    default: ApplicantStatus.Applied
  })
  applicationStatus: ApplicantStatus;

  @Column("datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
