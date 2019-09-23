import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ApplicantService } from "../services";
import { Applicant } from "../models/db";

export interface IAdminController {
  overview: (req: Request, res: Response, next: NextFunction) => void;
  manage: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for admin methods
 */
@injectable()
export class AdminController {
  private _applicantService: ApplicantService;
  private _cache: Cache;

  public constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService,
    @inject(TYPES.Cache) cache: Cache
  ) {
    this._cache = cache;
    this._applicantService = applicantService;
  }

  public overview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const [applications, totalApplications] = await this._applicantService.getAllAndCountSelection(["gender", "tShirtSize", "createdAt"], "createdAt", "ASC");

    // Create an array of the application times
    const createdAtTimes: Date[] = applications.map((applicant) => applicant.createdAt);

    // Create the map of genders and their respective count
    const genders = {"Male": 0, "Female": 0, "Other": 0};
    let genderSlice = "";

    // Create a map of T-Shirt sizes and their count
    const tShirts = {
      "XS": 0,
      "S": 0,
      "M": 0,
      "L": 0,
      "XL": 0,
      "XXL": 0
    };

    applications.forEach((applicant) => {
      genderSlice = applicant.gender === "Male" || applicant.gender === "Female" ? applicant.gender : "Other";
      genders[genderSlice]++;

      tShirts[applicant.tShirtSize] = 1 + (tShirts[applicant.tShirtSize] || 0);
    });

    res.render("pages/admin-overview", {
      totalApplications,
      applicationTimes: createdAtTimes,
      applicationGenders: genders,
      applicationTShirts: tShirts
    });
  };

  public manage = (req: Request, res: Response, next: NextFunction): void => {
    res.render("pages/admin-manage");
  };

  public manageApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const specifiedApplicant: Applicant = await this._applicantService.findOne(
      req.url.split("/")[2]
    );
    console.log(specifiedApplicant);
    res.render("pages/manageApplication", { applicant: specifiedApplicant });
  };
}
