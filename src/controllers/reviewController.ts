import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ReviewService } from "../services";
import { Applicant } from "../models/db";
import { HttpResponseCode } from "../util/errorHandling";
import { RequestUser } from "../util";

export interface ReviewControllerInterface {
  submit: (req: Request, res: Response, next: NextFunction) => Promise<boolean>;
  reviewPage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  nextReview: (req: Request, res: Response) => Promise<void>;
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

  public reviewPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.render("pages/review/review");
    return;
  };

  public nextReview = async (req: Request, res: Response): Promise<void> => {
    let nextApplication: Applicant;
    try {
      nextApplication = await this._reviewService.getNextApplication((req.user as RequestUser).authId);
    } catch (err) {
      res.status(HttpResponseCode.INTERNAL_ERROR).send({ message: "Failed to get another application" });
      return;
    }
    res.send(nextApplication);
    return;
  };

  public submit = async (req: Request, res: Response, next: NextFunction): Promise<boolean> => {
    return false;
  };
}
