import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ReviewService } from "../services";

export interface ReviewControllerInterface {
  submit: (req: Request, res: Response, next: NextFunction) => Promise<boolean>;
}

/**
 * A controller for review methods
 */
@injectable()
export class ReviewController implements ReviewControllerInterface {
  private _reviewService: ReviewService;

  public constructor(@inject(TYPES.ReviewService) reviewService: ReviewService) {
    this._reviewService = reviewService;
  }

  public submit = async (req: Request, res: Response, next: NextFunction): Promise<boolean> => {
    return false;
  };
}
