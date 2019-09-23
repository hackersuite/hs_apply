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
    const [applications, totalApplications] = await this._applicantService.getAllAndCountSelection(["gender", "createdAt"], "createdAt", "ASC");

    const applicationTimes: Date[] = applications.map((applicant) => applicant.createdAt);
    const genders = {"Male": 0, "Female": 0, "Other": 0};
    let genderSlice = "";
    applications.forEach((applicant) => {
      genderSlice = applicant.gender === "Male" || applicant.gender === "Female" ? applicant.gender : "Other";
      genders[genderSlice]++;
    });

    res.render("pages/admin-overview", { totalApplications, applicationTimes, applicationGenders: genders });
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
