import { Request, Response, NextFunction } from "express";
import { IApplicationSection } from "../settings";
import { Cache } from "../util/cache";
import { Sections } from "../models/sections";

/**
 * A controller for application methods
 */
export class ApplicationController {
  private cache: Cache;

  constructor(_cache: Cache) {
    this.cache = _cache;
  }

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