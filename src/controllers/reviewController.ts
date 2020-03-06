import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ReviewService } from "../services";
import { Applicant, Review } from "../models/db";
import { HttpResponseCode } from "../util/errorHandling";
import { RequestUser } from "../util";
import * as request from "request-promise-native";

export interface ReviewControllerInterface {
  submit: (req: Request, res: Response, next: NextFunction) => Promise<boolean>;
  reviewPage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  overviewPage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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

  public overviewPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let apiResult: any;
    try {
      apiResult = await request.get(`${process.env.AUTH_URL}/api/v1/users`, {
        headers: {
          Authorization: `${req.cookies["Authorization"]}`
        }
      });
    } catch (err) {
      // Some internal error has occured
      return next(err);
    }

    const applications: any = await this._reviewService.getAverageRatings();
    const columnNames = [["ApplicantID"], ["Email"], ["AverageScore"]];
    
    const authUsersResult: any = JSON.parse(apiResult).users;
    const authUsers = {};
    authUsersResult.forEach((a) => {
      authUsers[a._id] = { ...a };
    });

    const combinedApplications: any = [];
    applications.forEach( (application) => {
      combinedApplications.push({
        ...application,
        email: authUsers[application.applicantId].email,
      });
    });
    res.render("pages/review/overview", {applications: combinedApplications, applicationRows: columnNames} );
    return;
  }

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

  public getAverageReviews = async (req: Request, res: Response): Promise<Partial<Review>[]> => {
    return this._reviewService.getAverageRatings();
  }

}
