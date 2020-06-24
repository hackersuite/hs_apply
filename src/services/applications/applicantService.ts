import { injectable, inject } from "inversify";
import { Applicant } from "../../models/db/applicant";
import { ApplicantRepository } from "../../repositories";
import { TYPES } from "../../types";
import { ObjectID, Repository, DeleteResult } from "typeorm";
import { validateOrReject } from "class-validator";
import { Review } from "../../models/db";
import { ApplicantStatus } from "./applicantStatus";
import { logger } from "../../util";
import { CloudStorageService } from "../cloudStorage";

type ApplicationID = string | number | Date | ObjectID;

export interface ApplicantServiceInterface {
  getAll: () => Promise<Applicant[]>;
  getAllAndCountSelection: (
    columns: (keyof Applicant)[],
    orderBy?: keyof Applicant,
    orderType?: "ASC" | "DESC"
  ) => Promise<[Partial<Applicant>[], number]>;
  findOne: (id: ApplicationID) => Promise<Applicant>;
  save: (newApplicants: Applicant, file?: Buffer) => Promise<Applicant>;
}

@injectable()
export class ApplicantService implements ApplicantServiceInterface {
  private _applicantRepository: Repository<Applicant>;
  private _cloudStorageService: CloudStorageService;

  public constructor(
    @inject(TYPES.ApplicantRepository) applicantRepository: ApplicantRepository,
    @inject(TYPES.CloudStorageService) cloudStorageService: CloudStorageService
  ) {
    this._applicantRepository = applicantRepository.getRepository();
    this._cloudStorageService = cloudStorageService;
  }

  public getAll = async (columns?: (keyof Applicant)[]): Promise<Applicant[]> => {
    try {
      const options = columns ? { select: columns } : undefined;
      return await this._applicantRepository.find(options);
    } catch (err) {
      throw new Error(`Failed to get all applicants:\n${err}`);
    }
  };

  public getAllAndCountSelection = async (
    columns: (keyof Applicant)[],
    orderBy?: keyof Applicant,
    orderType?: "ASC" | "DESC"
  ): Promise<[Partial<Applicant>[], number]> => {
    const orderOptions = orderBy && orderBy ? { [orderBy]: orderType } : undefined;
    try {
      return await this._applicantRepository.findAndCount({
        select: columns,
        order: orderOptions
      });
    } catch (err) {
      throw new Error(`Failed to get the list of applications`);
    }
  };

  public findOne = async (id: ApplicationID, findBy?: keyof Applicant): Promise<Applicant> => {
    if (id === undefined) {
      throw new Error("Applicant ID must be provided");
    }

    try {
      const findColumn: keyof Applicant = findBy || "id";
      const applicant = await this._applicantRepository.findOne({ [findColumn]: id });
      if (!applicant) throw new Error('Failed to find applicant');
      return applicant;
    } catch (err) {
      throw new Error(`Failed to find an applicant:\n${err}`);
    }
  };

  public save = async (newApplicant: Applicant, file?: Buffer): Promise<Applicant> => {
    try {
      // Validate the new applicant using class-validation and fail if there is an error
      // Hide the target in the report for nicer error messages
      await validateOrReject(newApplicant, {
        validationError: { target: false }
      });
    } catch (errors) {
      logger.error(errors);
      throw new Error("Failed to validate applicant");
    }

    if (file && newApplicant.cv) {
      // Save the CV to dropbox if the CV is provided
      try {
        await this._cloudStorageService.upload(newApplicant.cv, file);
      } catch (err) {
        throw new Error("Failed to save applicant CV");
      }
    }

    try {
      return await this._applicantRepository.save(newApplicant);
    } catch (err) {
      throw new Error(`Failed to save applicant:\n${err}`);
    }
  };

  public delete = async (id: ApplicationID): Promise<DeleteResult> => {
    if (id === undefined) throw new Error("Applicant ID must be provided");

    // Find the applicant via the provided ID
    let applicant: Applicant;
    try {
      applicant = await this._applicantRepository.findOneOrFail(id);
    } catch (err) {
      throw new Error("Failed to find applicant using the provided ID");
    }

    try {
      if (applicant.cv) {
        await this._cloudStorageService.delete(applicant.cv);
      }
    } catch (err) {
      logger.error(err, "Failed to remove the applicants CV");
    }

    try {
      return await this._applicantRepository.delete(id);
    } catch (err) {
      throw new Error(`Failed to remove an applicant:\n${err}`);
    }
  };

  public getKRandomToReview = async (reviewerID: string, chooseFromK = 5): Promise<Applicant[]> => {
    // TODO: Refactor query below to make it more readable, there must be a better way...
    let applications;
    try {
      applications = await this._applicantRepository
        .createQueryBuilder("application")
        .where(qb => {
          const subQuery = qb
            .subQuery()
            .select("review.applicantId")
            .from(Review, "review")
            .groupBy("review.applicantId")
            .having("COUNT(review.applicantId) >= 2")
            .getQuery();
          return "id NOT IN " + subQuery;
        })
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select("review.applicantId")
            .from(Review, "review")
            .where("review.createdByAuthID = :authID", { authID: reviewerID })
            .getQuery();
          return "id NOT IN " + subQuery;
        })
        .andWhere("application.applicationStatus = :applicantState", {
          applicantState: ApplicantStatus.Applied.toString()
        })
        .orderBy("application.createdAt", "ASC")
        .take(chooseFromK)
        .getMany();
    } catch (err) {
      logger.error(err);
      return [];
    }

    return applications;
  };

  // public getCVLink = async (fileName: string): Promise<string> => {
  //   if (!process.env.DROPBOX_API_TOKEN)
  //     throw new Error(
  //       "Failed to upload CV to Dropbox, set dropbox envs correctly"
  //     );
  //   let result: any;
  //   let link: string;
  //   try {
  //     result = await request.post(
  //       "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: "Bearer " + process.env.DROPBOX_API_TOKEN
  //         },
  //         body: `{ "path": "/hackathon-cv/${fileName}" }`
  //       }
  //     );
  //     link = result.url;
  //   } catch (err) {
  //     console.log(err);
  //   }

  //   link = link.slice(0, -4) + "raw=1";

  //   return link;
  // };
}
