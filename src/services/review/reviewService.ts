import { injectable, inject } from "inversify";
import { Repository } from "typeorm";
import { Review, Applicant } from "../../models/db";
import { TYPES } from "../../types";
import { ReviewRepository } from "../../repositories/repositories";
import { ApplicantService } from "../applications/applicantService";

export interface ReviewServiceInterface {
  getAll: () => Promise<Review[]>;
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
      const options: object = columns ? { select: columns } : undefined;
      return await this._reviewRepository.find(options);
    } catch (err) {
      throw new Error(`Failed to get all reviews:\n${err}`);
    }
  };

  public getNextApplication = async (reviewerID: string, chooseFromK = 10): Promise<Applicant> => {
    // 1. Select next k applicants, ordered by the oldest applications first (with < 2 reviews)
    // 2. Choose a random application from k and return

    const applications: Applicant[] = (await this._applicantService.getKRandomToReview(reviewerID, chooseFromK)) || [];

    // Set chooseFromK to applications length is too few remaining
    // Also check for > 0 applications, prevents Array out of bounds
    const numberOfApplications = Math.min(applications.length, chooseFromK);
    if (!numberOfApplications || numberOfApplications === 0) return undefined;

    // Pick a random application from the top k
    return applications[(Math.random() * (numberOfApplications + 1)) | 0];
  };
}
