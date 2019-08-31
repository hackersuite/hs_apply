import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { Sections } from "../models/sections";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";

/**
 * A controller for application methods
 */
@injectable()
export class ApplicationController {
  @inject(TYPES.Cache)
  private cache: Cache;

  public apply = (req: Request, res: Response, next: NextFunction) => {
    const cachedSections: Array<Sections> = this.cache.getAll(Sections.name);
    const sections = cachedSections[0].sections;
    res.render("pages/apply", { sections: sections });
  };

  public submitApplication = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    res.send("Done");
  };
  /**
   * { applicantName: '',
   *   applicantAge: '',
   *   applicantGender: [ 'Male', '' ],
   *   applicantNationality: '',
   *   applicantCountry: '',
   *   applicantCity: '',
   *   applicantUniversity: '',
   *   applicantStudyYear: '',
   *   applicantWorkArea: [ '', '' ],
   *   applicantSkills: '',
   *   applicantHackathonCount: '',
   *   applicantWhyChoose: '',
   *   applicantPastProj: '',
   *   applicantHardwareReq: '',
   *   applicantDietaryRequirements: [ '', '<If this is not empty, then "other" was chosen>' ],
   *   applicantTShirt: 'XS',
   *   applicantAcceptDataSharing: '',     | These can be ignored since they they are required + client-side validation
   *   applicantCodeConduct: '',           |
   *   submit: 'Submit'
   *  }
   */
}