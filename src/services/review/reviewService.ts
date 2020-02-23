import { injectable, inject } from "inversify";
import { Repository } from "typeorm";
import { Review, Reviewer } from "../../models/db";
import { TYPES } from "../../types";
import { ReviewRepository, ReviewerRepository } from "../../repositories/repositories";

export interface ReviewServiceInterface {
  getAll: () => Promise<Review[]>;
}

@injectable()
export class ReviewService implements ReviewServiceInterface {
  private _reviewRepository: Repository<Review>;
  private _reviewerRepository: Repository<Reviewer>;

  public constructor(
    @inject(TYPES.ReviewRepository) reviewRepository: ReviewRepository,
    @inject(TYPES.ReviewerRepository) reviewerRepository: ReviewerRepository
  ) {
    this._reviewRepository = reviewRepository.getRepository();
    this._reviewerRepository = reviewerRepository.getRepository();
  }

  public getAll = async (columns?: (keyof Review)[]): Promise<Review[]> => {
    try {
      const options: object = columns ? { select: columns } : undefined;
      return await this._reviewRepository.find(options);
    } catch (err) {
      throw new Error(`Failed to get all reviews:\n${err}`);
    }
  };
}
