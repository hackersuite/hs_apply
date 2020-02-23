import { Applicant, Review, Reviewer } from "../models/db";
import { BaseRepository } from "./baseRepository";
import { injectable } from "inversify";
import { Repository } from "typeorm";

@injectable()
export class ApplicantRepository extends BaseRepository<Applicant> {
  public getRepository(): Repository<Applicant> {
    return super.connect(Applicant);
  }
}

@injectable()
export class ReviewRepository extends BaseRepository<Review> {
  public getRepository(): Repository<Review> {
    return super.connect(Review);
  }
}

@injectable()
export class ReviewerRepository extends BaseRepository<Reviewer> {
  public getRepository(): Repository<Reviewer> {
    return super.connect(Reviewer);
  }
}
