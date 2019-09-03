import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { Sections } from "../models/sections";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ApplicationService } from "../services";
import { Applicant } from "../models/db";
import { validateOrReject } from "class-validator";
import { HttpResponseCode } from "../util/errorHandling";

export interface IApplicationController {
  apply: (req: Request, res: Response, next: NextFunction) => void;
  submitApplication: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for application methods
 */
@injectable()
export class ApplicationController {
  private _cache: Cache;
  private _applicationService: ApplicationService;

  public constructor(
    @inject(TYPES.Cache) cache: Cache,
    @inject(TYPES.ApplicationService) applicationService: ApplicationService
  ) {
    this._cache = cache;
    this._applicationService = applicationService;
  }

  public apply = (req: Request, res: Response, next: NextFunction): void => {
    const cachedSections: Array<Sections> = this._cache.getAll(Sections.name);
    const sections = cachedSections[0].sections;
    res.render("pages/apply", { sections: sections });
  };

  public submitApplication = async (req: Request, res: Response, next: NextFunction) => {
    const {
      applicantName,
      applicantAge,
      applicantGender,
      applicantGenderOther,
      applicantNationality,
      applicantCountry,
      applicantCity,
      applicantUniversity,
      applicantStudyYear,
      applicantWorkArea,
      applicantWorkAreaOther,
      applicantSkills,
      applicantHackathonCount,
      applicantWhyChoose,
      applicantPastProj,
      applicantHardwareReq,
      applicantDietaryRequirements,
      applicantDietaryRequirementsOther,
      applicantTShirt
    } = req.body;

    const newApplication: Applicant = new Applicant();
    newApplication.name = applicantName;
    newApplication.age = Number(applicantAge);
    newApplication.gender = applicantGender === "Other" ? applicantGenderOther : applicantGender;
    newApplication.nationality = applicantNationality;
    newApplication.country = applicantCountry;
    newApplication.city = applicantCity;
    newApplication.university = applicantUniversity;
    newApplication.yearOfStudy = applicantStudyYear;
    newApplication.workArea = applicantWorkArea === "Other" ? applicantWorkAreaOther : applicantWorkArea;
    newApplication.skills = applicantSkills;
    newApplication.hackathonCount = Number(applicantHackathonCount);
    newApplication.whyChooseHacker = applicantWhyChoose;
    newApplication.pastProjects = applicantPastProj;
    newApplication.hardwareRequests = applicantHardwareReq;
    newApplication.dietaryRequirements = applicantDietaryRequirements === "Other" ? applicantDietaryRequirementsOther : applicantDietaryRequirements;
    newApplication.tShirtSize = applicantTShirt;

    // Validate the new applicant using class-validation and fail if there is an error
    // Hide the target in the report for nicer error messages
    try {
      await validateOrReject(newApplication, { validationError: { target: false } });
    } catch (errors) {
      return res.status(HttpResponseCode.BAD_REQUEST)
        .send({
          error: true,
          message: "Could not create application!"
        });
    }
    const createdApplication = await this._applicationService.save([newApplication]);
    res.send(createdApplication);
  };
}