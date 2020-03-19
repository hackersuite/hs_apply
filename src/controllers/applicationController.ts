import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { Sections } from "../models/sections";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ApplicantService } from "../services";
import { Applicant } from "../models/db";
import { HttpResponseCode } from "../util/errorHandling";
import { RequestUser } from "@unicsmcr/hs_auth_client";
import { ApplicantStatus } from "../services/applications/applicantStatus";
import { applicationMapping } from "../util/decorator";

export interface ApplicationControllerInterface {
  apply: (req: Request, res: Response, next: NextFunction) => void;
  submitApplication: (req: Request, res: Response, next: NextFunction) => void;
  cancel: (req: Request, res: Response, next: NextFunction) => void;
  confirmPlace: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for application methods
 */
@injectable()
export class ApplicationController implements ApplicationControllerInterface {
  private _cache: Cache;
  private _applicantService: ApplicantService;

  public constructor(
    @inject(TYPES.Cache) cache: Cache,
    @inject(TYPES.ApplicantService) applicantService: ApplicantService
  ) {
    this._cache = cache;
    this._applicantService = applicantService;
  }

  public apply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if the user has already made an application using req.user.authId
    let application: Applicant;
    try {
      application = await this._applicantService.findOne((req.user as RequestUser).authId, "authId");
    } catch (err) {
      return next(err);
    }

    if (application) {
      // The application has been made, redirect to dashboard
      return res.redirect("/");
    } else {
      const cachedSections: Array<Sections> = this._cache.getAll(Sections.name);
      const sections = cachedSections[0].sections;
      res.render("pages/apply", { sections: sections });
    }
  };

  public submitApplication = async (req: Request, res: Response): Promise<void> => {
    const reqUser: RequestUser = req.user as RequestUser;

    const applicationFields: any = req.body;
    const newApplication: Applicant = new Applicant();

    for (const [name, options] of applicationMapping.entries()) {
      if (options && options.hasOther) {
        newApplication[name] = applicationFields[`${name}Other`] || applicationFields[name] || "Other";
      } else if (options && options.isNumeric) {
        const fieldToCastNumeric = applicationFields[name];
        newApplication[name] = this.isNumeric(fieldToCastNumeric) ? Number(fieldToCastNumeric) : undefined;
      } else {
        newApplication[name] = applicationFields[name];
      }
    }
    newApplication.authId = (req.user as RequestUser).authId;
    newApplication.applicationStatus = ApplicantStatus.Applied;

    // Handling the CV file
    let cvFile: Buffer;
    if (req.files && req.files.length === 1 && req.files[0].fieldname === "cv") {
      // Remove all non-ascii characters from the name and filename
      /* eslint no-control-regex: "off" */
      const nameCleaned: string = reqUser.name.replace(/[^\x00-\x7F]/g, "");
      const fileNameCleaned: string = req.files[0].originalname.replace(/[^\x00-\x7F]/g, "");
      newApplication.cv = `${nameCleaned}.${reqUser.email}.${fileNameCleaned}`;
      cvFile = req.files[0].buffer;
    }

    try {
      await this._applicantService.save(newApplication, cvFile);
    } catch (errors) {
      console.log(errors);
      res.status(HttpResponseCode.BAD_REQUEST).send({
        error: true,
        message: "Could not create application!"
      });
      return;
    }
    res.send({
      message: "Application recieved!"
    });
  };

  public cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let application: Applicant;
    try {
      application = await this._applicantService.findOne((req.user as RequestUser).authId, "authId");
    } catch (err) {
      return next(err);
    }

    if (application.applicationStatus <= ApplicantStatus.Applied && res.locals.applicationsOpen) {
      // Delete the application so they can re-apply
      try {
        await this._applicantService.delete(application.id);
      } catch (err) {
        return next(err);
      }
    } else {
      // It is too late in the process to re-apply so cancel their application
      try {
        application.applicationStatus = ApplicantStatus.Cancelled;
        await this._applicantService.save(application);
      } catch (err) {
        return next(err);
      }
    }

    res.redirect("/");
  };

  private isNumeric(n: any): boolean {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  public checkin = async (req: Request, res: Response): Promise<void> => {
    const checkinID: string = req.params.id;
    let application: Applicant;
    try {
      application = await this._applicantService.findOne(checkinID);
    } catch (err) {
      res.status(HttpResponseCode.BAD_REQUEST).send({
        message: "Hacker could not be checked in"
      });
      return;
    }

    if (application.applicationStatus === ApplicantStatus.Confirmed) {
      // Update the application to state that they have attended the hackathon
      application.applicationStatus = ApplicantStatus.Admitted;
      try {
        await this._applicantService.save(application);
      } catch (err) {
        res.status(HttpResponseCode.BAD_REQUEST).send({
          message: "Hacker could not be checked in"
        });
        return;
      }
    } else {
      res.status(HttpResponseCode.BAD_REQUEST).send({
        message: "Hacker cannot be accepted! Please notify organiser!"
      });
      return;
    }

    res.send({
      message: "Hacker checked in!"
    });
  };

  public confirmPlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as RequestUser;

    try {
      let applicant = await this._applicantService.findOne(user.authId, "authId");
      if (!applicant) {
        applicant = new Applicant();
        applicant.authId = user.authId;
        applicant.age = 2020;
        applicant.gender = "N/A";
        applicant.country = "N/A";
        applicant.city = "N/A";
        applicant.university = "N/A";
        applicant.degree = "N/A";
        applicant.yearOfStudy = "N/A";
        applicant.dietaryRequirements = "N/A";
        applicant.tShirtSize = "N/A";
        applicant.hearAbout = "N/A";
      }
      applicant.applicationStatus = ApplicantStatus.Confirmed;
      await this._applicantService.save(applicant);
    } catch (err) {
      console.log(err);
      res.status(HttpResponseCode.BAD_REQUEST).send({
        error: true,
        message: "Could not confirm your place!"
      });
      return;
    }
    res.send({
      message: "Your place has been confirmed!"
    });
  };
}
