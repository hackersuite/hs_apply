import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Applicant } from "../models/db";
import { ApplicantService } from "../services";
import { RequestUser } from "@unicsmcr/hs_auth_client";
import { ApplicantStatus } from "../services/applications/applicantStatus";

export interface DashboardControllerInterface {
  dashboard: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@injectable()
export class DashboardController implements DashboardControllerInterface {
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
      applicant = await this._applicantService.findOne((req.user as RequestUser).authId, "authId");
    } catch (err) {
      return next(err);
    }

    const applicationStatus: ApplicantStatus =
      applicant !== undefined ? applicant.applicationStatus : ApplicantStatus.Verified;

    // Check that the applications are still open
    // Get the open and close time from the predefined settings and compare to the current time
    const applicationsOpenTime: number = new Date(req.app.locals.settings.applicationsOpen).getTime();
    const applicationsCloseTime: number = new Date(req.app.locals.settings.applicationsClose).getTime();
    const currentTime: number = new Date().getTime();
    const applicationsOpen: boolean = currentTime >= applicationsOpenTime && currentTime <= applicationsCloseTime;

    res.render("pages/dashboard", {
      applicationStatus: applicationStatus,
      applicantName: (req.user as RequestUser).name,
      applicationsOpen: applicationsOpen
    });
  };
}
