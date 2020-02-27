import * as request from "request-promise-native";
import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ApplicantService } from "../services";
import { Applicant } from "../models/db";
import * as fs from "fs";
import { ApplicantStatus } from "../services/applications/applicantStatus";
import { getAllUsers, RequestUser } from "@unicsmcr/hs_auth_client"

export interface AdminControllerInterface {
  overview: (req: Request, res: Response, next: NextFunction) => void;
  manage: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for admin methods
 */
@injectable()
export class AdminController implements AdminControllerInterface {
  private _applicantService: ApplicantService;
  private _cache: Cache;

  public constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService,
    @inject(TYPES.Cache) cache: Cache
  ) {
    this._cache = cache;
    this._applicantService = applicantService;
  }

  public overview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    let applications: Partial<Applicant>[], totalApplications: number;
    try {
      [applications, totalApplications] = await this._applicantService.getAllAndCountSelection(
        [
          "gender",
          "tShirtSize",
          "createdAt",
          "dietaryRequirements",
          "hardwareRequests",
          "university",
          "applicationStatus"
        ],
        "createdAt",
        "ASC"
      );
    } catch (err) {
      return next("Failed to get applications overview");
    }

    // Create an array of the application times
    const createdAtTimes: Date[] = applications.map(applicant => applicant.createdAt);

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

    // Create a map to contain the application status stats
    const appStatus = {};
    let applicationStatusValue: string;

    // Create an array with all the hardware requests
    const hardwareReq = [];

    applications.forEach(applicant => {
      genderSlice = applicant.gender === "Male" || applicant.gender === "Female" ? applicant.gender : "Other";
      genders[genderSlice]++;

      tShirts[applicant.tShirtSize] = 1 + (tShirts[applicant.tShirtSize] || 0);

      dietryReq[applicant.dietaryRequirements] = 1 + (dietryReq[applicant.dietaryRequirements] || 0);

      if (
        applicant.hardwareRequests &&
        applicant.hardwareRequests !== "None" &&
        applicant.hardwareRequests !== "Nothing"
      ) {
        hardwareReq.push(applicant.hardwareRequests);
      }

      university[applicant.university] = 1 + (university[applicant.university] || 0);

      applicationStatusValue = ApplicantStatus[applicant.applicationStatus];
      appStatus[applicationStatusValue] = 1 + (appStatus[applicationStatusValue] || 0);
    });

    res.render("pages/admin/adminOverview", {
      totalApplications,
      applicationTimes: createdAtTimes,
      applicationGenders: genders,
      applicationTShirts: tShirts,
      applicationDietry: dietryReq,
      applicationHardwareReq: hardwareReq,
      applicationUniversity: university,
      applicationStatus: appStatus
    });
  };

  public manage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    let authUsersResult: RequestUser[];
    try {
      authUsersResult = await getAllUsers(req.cookies["Authorization"])
    } catch (err) {
      next(err)
    }

    const columnsToSelect: (keyof Applicant)[] = [
      "id",
      "authId",
      "university",
      "yearOfStudy",
      "applicationStatus",
      "createdAt"
    ];
    const columnNames: object[] = [["Name"], ["Email"], ["University"], ["Year"], ["Status"], ["Manage"]];
    const applications: Applicant[] = await this._applicantService.getAll(columnsToSelect);

    const authUsers = {};
    authUsersResult.forEach(a => {
      authUsers[a.authId] = { ...a };
    });

    const combinedApplications: any = [];
    applications.forEach(a => {
      combinedApplications.push({
        ...a,
        ...authUsers[a.authId],
        applicationStatus: ApplicantStatus[a.applicationStatus]
      });
    });

    res.render("pages/admin/adminManage", {
      applicationRows: columnNames,
      applications: combinedApplications
    });
  };

  public manageApplication = async (req: Request, res: Response): Promise<void> => {
    const specifiedApplicant: Applicant = await this._applicantService.findOne(req.url.split("/")[2]);
    res.render("pages/manageApplication", {
      applicant: specifiedApplicant
    });
  };

  public downloadCSV = async (req: Request, res: Response): Promise<void> => {
    let allApplicants: Partial<Applicant>[];
    try {
      const allApplicantsAndCount = await this._applicantService.getAllAndCountSelection(
        ["id", "authId", "whyChooseHacker", "skills", "pastProjects", "degree", "createdAt"],
        "createdAt",
        "ASC"
      );
      allApplicants = allApplicantsAndCount[0];
    } catch (err) {
      res.send("Failed to get the applications!");
      return;
    }

    let authUsersResult: RequestUser[];
    try {
      authUsersResult = await getAllUsers(req.cookies["Authorization"])
    } catch (err) {
      res.send("Failed to get the users authentication info!");
    }

    const authUsers = {};
    // Expand the auth user to use the auth id as the key for each object
    authUsersResult.forEach(a => {
      authUsers[a.authId] = { ...a };
    });


    const stream = fs.createWriteStream("voting.csv");
    stream.on("finish", () => {
      // Once the stream is closed, send the file in the response
      res.download("voting.csv", err => {
        if (err) {
          console.log("File transfer failed!");
        }
        // Remove the voting.csv file once the download has either completed or failed
        fs.unlink("voting.csv", err => {
          if (err) {
            console.log(`Failed to remove the voting.csv file! ${err}`);
          }
        });
      });
    });
    allApplicants.forEach(application => {
      // UID, TID, WhyChoose?, Proj, Skills, Degree
      const team: string = authUsers[application.authId] ? authUsers[application.authId].team : "";
      application.whyChooseHacker = this.escapeForCSV(application.whyChooseHacker);
      application.pastProjects = this.escapeForCSV(application.pastProjects);
      application.skills = this.escapeForCSV(application.skills);
      stream.write(
        `${application.createdAt},${application.id},${team},"${application.whyChooseHacker}","${application.pastProjects}","${application.skills}","${application.degree}"\n`
      );
    });
    stream.end();
  };

  private escapeForCSV = (input: string): string => {
    return input ? input.replace(/"/g, "") : "";
  };
}
