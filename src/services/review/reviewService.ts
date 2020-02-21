import { injectable, inject } from "inversify";
import { Applicant } from "../../models/db/applicant";
import { ApplicantRepository } from "../../repositories";
import { TYPES } from "../../types";
import { ObjectID, Repository, DeleteResult } from "typeorm";
import { validateOrReject } from "class-validator";
import * as request from "request-promise-native";
import { Review, Reviewer } from "../../models/db";

type ApplicationID = string | number | Date | ObjectID;

export interface ReviewServiceInterface {
  getAll: () => Promise<Review[]>;
}

@injectable()
export class ReviewService implements ReviewServiceInterface {
  private _reviewRepository: Repository<Review>;
  private _reviewerRepository: Repository<Reviewer>;

  // public constructor(@inject(TYPES.ApplicantRepository) applicantRepository: ApplicantRepository) {
  //   this._applicantRepository = applicantRepository.getRepository();
  // }

  public getAll = async (columns?: (keyof Review)[]): Promise<Review[]> => {
    try {
      const options: object = columns ? { select: columns } : undefined;
      return await this._reviewRepository.find(options);
    } catch (err) {
      throw new Error(`Failed to get all reviews:\n${err}`);
    }
  };
}
