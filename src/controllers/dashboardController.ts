import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Applicant } from "../models/db";
import { ApplicantService } from "../services";
import { RequestUser } from "../util/auth";
import { ApplicantStatus } from "../services/applications/applicantStatus";

export interface IDashboardController {
  dashboard: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@injectable()
export class DashboardController {
  private _cache: Cache;
  private _applicantService: ApplicantService;

  public constructor(
    @inject(TYPES.Cache) cache: Cache,
    @inject(TYPES.ApplicantService) applicantService: ApplicantService
  ) {
    this._cache = cache;
    this._applicantService = applicantService;
  }

  public dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let applicant: Applicant;
    try {
      applicant = await this._applicantService.findOne((req.user as RequestUser).auth_id, "authId");
    } catch (err) {
      return next(err);
    }

    const applicationStatus: ApplicantStatus = applicant !== undefined ?
      applicant.applicationStatus : ApplicantStatus.Verified;
    res.render("pages/dashboard", {
      "applicationStatus": applicationStatus,
      "applicantName": (req.user as RequestUser).name
    });
  };
}