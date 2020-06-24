import { injectable, inject } from "inversify";
import { Repository } from "typeorm";
import { Review, Applicant } from "../../models/db";
import { TYPES } from "../../types";
import { ReviewRepository } from "../../repositories/repositories";
import { ApplicantService } from "../applications/applicantService";

export interface ReviewServiceInterface {
  getAll: () => Promise<Review[]>;
  getNextApplication: (reviewerID: string, chooseFromK: number) => Promise<Applicant|undefined>;
  save: (newReview: Review) => Promise<Review>;
  getReviewCountByApplicantID: (applicantID: string) => Promise<number>;
  getReviewCountByAuthID: (reviewerAuthID: string) => Promise<number>;
}

@injectable()
export class ReviewService implements ReviewServiceInterface {
  private _applicantService: ApplicantService;
  private _reviewRepository: Repository<Review>;

  public constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService,
    @inject(TYPES.ReviewRepository) reviewRepository: ReviewRepository
  ) {
    this._applicantService = applicantService;
    this._reviewRepository = reviewRepository.getRepository();
  }

  public getAll = async (columns?: (keyof Review)[]): Promise<Review[]> => {
    try {
      const options = columns ? { select: columns } : undefined;
      return await this._reviewRepository.find(options);
    } catch (err) {
      throw new Error(`Failed to get all reviews:\n${err}`);
    }
  };

  public getNextApplication = async (reviewerAuthID: string, chooseFromK = 10): Promise<Applicant|undefined> => {
    // 1. Select next k applicants, ordered by the oldest applications first (with < 2 reviews)
    // 2. Choose a random application from k and return

    const applications: Applicant[] =
      (await this._applicantService.getKRandomToReview(reviewerAuthID, chooseFromK)) || [];

    // Set chooseFromK to applications length if too few remaining
    // Also check for > 0 applications, prevents Array out of bounds
    const numberOfApplications = Math.min(applications.length, chooseFromK);
    if (!numberOfApplications) return undefined;

    // Pick a random application from the top k
    return applications[(Math.random() * numberOfApplications) | 0];
  };

  public getReviewCountByApplicantID = async (applicantID: string): Promise<number> => {
    try {
      return await this._reviewRepository.count({
        select: ["applicant"],
        where: { applicant: applicantID }
      });
    } catch (err) {
      throw new Error("Failed to get review count for application");
    }
  };

  public getReviewCountByAuthID = async (reviewerAuthID: string): Promise<number> => {
    let reviewsCreatedCount: number;
    try {
      reviewsCreatedCount = await this._reviewRepository.count({
        where: {
          createdByAuthID: reviewerAuthID
        }
      });
    } catch (err) {
      throw new Error("Failed to get review count");
    }

    return reviewsCreatedCount;
  };

  public save = async (newReview: Review): Promise<Review> => {
    try {
      return await this._reviewRepository.save(newReview);
    } catch (err) {
      throw new Error(`Failed to save review:\n${err}`);
    }
  };
}
