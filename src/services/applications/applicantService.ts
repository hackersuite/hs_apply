import { injectable, inject } from "inversify";
import { Applicant } from "../../models/db/applicant";
import { ApplicantRepository } from "../../repositories";
import { TYPES } from "../../types";
import { ObjectID, Repository, DeleteResult } from "typeorm";
import { validateOrReject } from "class-validator";
import * as request from "request-promise-native";

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

  public constructor(@inject(TYPES.ApplicantRepository) applicantRepository: ApplicantRepository) {
    this._applicantRepository = applicantRepository.getRepository();
  }

  public getAll = async (columns?: (keyof Applicant)[]): Promise<Applicant[]> => {
    try {
      const options: object = columns ? { select: columns } : undefined;
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
    const orderOptions: object = orderBy && orderBy ? { [orderBy]: orderType } : undefined;
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
      return await this._applicantRepository.findOne({ [findColumn]: id });
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
      console.log(errors);
      throw new Error("Failed to validate applicant");
    }

    if (file) {
      // Save the CV to dropbox if the CV is provided
      try {
        await this.saveToDropbox(newApplicant.cv, file);
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

  public delete = async (id: ApplicationID, findBy?: keyof Applicant): Promise<DeleteResult> => {
    if (id === undefined) {
      throw new Error("Applicant ID must be provided");
    }

    const findColumn: keyof Applicant = findBy || "id";
    try {
      return await this._applicantRepository.delete({ [findColumn]: id });
    } catch (err) {
      throw new Error(`Failed to remove an applicant:\n${err}`);
    }
  };

  private saveToDropbox = async (fileName: string, file: Buffer): Promise<string> => {
    if (!process.env.DROPBOX_API_TOKEN) {
      throw new Error("Failed to upload CV to Dropbox, set dropbox envs correctly");
    }
    if (!process.env.DROPBOX_API_TOKEN) throw new Error("Failed to upload CV to Dropbox, set dropbox envs correctly");

    const result = await request.post("https://content.dropboxapi.com/2/files/upload", {
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: "Bearer " + process.env.DROPBOX_API_TOKEN,
        "Dropbox-API-Arg": `{"path": "/hackathon-cv/${fileName}", "mode": "add", "autorename": true, "mute": false}`
      },
      body: file
    });

    return result;
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
