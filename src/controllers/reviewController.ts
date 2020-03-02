import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ReviewService, ApplicantService } from "../services";
import { Applicant, Review } from "../models/db";
import { HttpResponseCode } from "../util/errorHandling";
import { RequestUser } from "@unicsmcr/hs_auth_client";
import { reviewApplicationMapping } from "../util";

export interface ReviewControllerInterface {
  submit: (req: Request, res: Response) => Promise<void>;
  reviewPage: (req: Request, res: Response) => Promise<void>;
  nextReview: (req: Request, res: Response) => Promise<void>;
}

/**
 * A controller for review methods
 */
@injectable()
export class ReviewController implements ReviewControllerInterface {
  private _reviewService: ReviewService;
  private _applicantService: ApplicantService;

  public constructor(
    @inject(TYPES.ReviewService) reviewService: ReviewService,
    @inject(TYPES.ApplicantService) applicantService: ApplicantService
  ) {
    this._reviewService = reviewService;
    this._applicantService = applicantService;
  }

  public reviewPage = async (req: Request, res: Response): Promise<void> => {
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

    res.send({
      application: nextApplication,
      reviewFields: Array.from(reviewApplicationMapping)
    });
    return;
  };

  public submit = async (req: Request, res: Response): Promise<void> => {
    const { applicationID, averageScore } = req.body;

    // Find the applicant by the provided ID
    const application = await this._applicantService.findOne(applicationID);

    const newReview = new Review();
    newReview.createdByAuthID = (req.user as RequestUser).authId;
    newReview.applicant = application;
    newReview.averageScore = averageScore;
    const savedReview = await this._reviewService.save(newReview);
    console.log(savedReview);

    res.send();
  };
}
