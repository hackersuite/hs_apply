import * as request from "request-promise-native";
import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ApplicantService } from "../services";
import { Applicant } from "../models/db";
import { RequestUser } from "../util/auth";

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
    const [applications, totalApplications] = await this._applicantService.getAllAndCountSelection(["gender", "tShirtSize", "createdAt", "dietaryRequirements", "hardwareRequests", "university"], "createdAt", "ASC");

    // Create an array of the application times
    const createdAtTimes: Date[] = applications.map(
      applicant => applicant.createdAt
    );

    // Create the map of genders and their respective count
    const genders = { Male: 0, Female: 0, Other: 0 };
    let genderSlice = "";

    // Create a map of T-Shirt sizes and their count
    const tShirts = {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0
    };

    // Create a map for the dietry requirements
    const dietryReq = {};

    // Create a map to contain the universities and counts
    const university = {};

    // Create an array with all the hardware requests
    const hardwareReq = [];

    applications.forEach(applicant => {
      genderSlice =
        applicant.gender === "Male" || applicant.gender === "Female"
          ? applicant.gender
          : "Other";
      genders[genderSlice]++;

      tShirts[applicant.tShirtSize] = 1 + (tShirts[applicant.tShirtSize] || 0);

      dietryReq[applicant.dietaryRequirements] =
        1 + (dietryReq[applicant.dietaryRequirements] || 0);

      if (
        applicant.hardwareRequests &&
        (applicant.hardwareRequests !== "None" &&
          applicant.hardwareRequests !== "Nothing")
      ) {
        hardwareReq.push(applicant.hardwareRequests);
      }

      university[applicant.university] = 1 + (university[applicant.university] || 0);
    });

    res.render("pages/admin/adminOverview", {
      totalApplications,
      applicationTimes: createdAtTimes,
      applicationGenders: genders,
      applicationTShirts: tShirts,
      applicationDietry: dietryReq,
      applicationHardwareReq: hardwareReq,
      applicationUniversity: university
    });
  };

  public manage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let apiResult: any;
    try {
      apiResult = await request
        .get(`${process.env.AUTH_URL}/api/v1/users`, {
          headers: {
            "Authorization": `${req.cookies["Authorization"]}`
          }
      });
    } catch (err) {
      // Some internal error has occured
      return next(err);
    }

    const columnsToSelect: (keyof Applicant)[] = ["id", "authId", "university", "yearOfStudy", "applicationStatus", "createdAt"];
    const columnNames: object[] = [
      ["Name"],
      ["Email"],
      ["University"],
      ["Year"],
      ["V/S/I/C", "Verified / Submitted / Invited / Confirmed"],
      ["Manage"]
    ];
    const applications: Applicant[] = await this._applicantService.getAll(
      columnsToSelect
    );

    const authUsersResult: any = JSON.parse(apiResult).users;
    const authUsers = {};
    authUsersResult.forEach(a => {
      authUsers[a._id] = {...a};
    });

    const combinedApplications: any = [];
    applications.forEach(a => {
      combinedApplications.push({...a, ...authUsers[a.authId]});
    });

    res.render("pages/admin/adminManage", {
      applicationRows: columnNames,
      applications: combinedApplications
    });
  };

  public manageApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const specifiedApplicant: Applicant = await this._applicantService.findOne(
      req.url.split("/")[2]
    );
    res.render("pages/manageApplication", {
      applicant: specifiedApplicant
    });
  };
}
