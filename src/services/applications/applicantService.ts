import { injectable, inject } from "inversify";
import { Applicant } from "../../models/db/applicant";
import { ApplicantRepository } from "../../repositories";
import { TYPES } from "../../types";
import { ObjectID, Repository } from "typeorm";
import { validateOrReject } from "class-validator";
import * as request from "request-promise-native";

type ApplicationID = string | number | Date | ObjectID;

export interface IApplicantService {
  getAll: () => Promise<Applicant[]>;
  findOne: (id: ApplicationID) => Promise<Applicant>;
  save: (newApplicants: Applicant, file?: Buffer) => Promise<Applicant>;
}

@injectable()
export class ApplicantService implements IApplicantService {
  private _applicantRepository: Repository<Applicant>;

  public constructor(
    @inject(TYPES.ApplicantRepository)
    applicantRepository: ApplicantRepository
  ) {
    this._applicantRepository = applicantRepository.getRepository();
  }

  public getAll = async (): Promise<Applicant[]> => {
    try {
      return await this._applicantRepository.find();
    } catch (err) {
      throw new Error(`Failed to get all applicants:\n${err}`);
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

  public remove = async (id: ApplicationID, findBy?: keyof Applicant): Promise<void> => {
      if (id === undefined) {
        throw new Error("Applicant ID must be provided");
      }

      try {
        const findColumn: keyof Applicant = findBy || "id";
        await this._applicantRepository.delete({ [findColumn]: id });
      } catch (err) {
        throw new Error(`Failed to remove an applicant:\n${err}`);
      }
    };

  private saveToDropbox = async (fileName: string, file: Buffer): Promise<string> => {
    if (!process.env.DROPBOX_API_TOKEN)
      throw new Error("Failed to upload CV to Dropbox, set dropbox envs correctly");

    const result = await request.post("https://content.dropboxapi.com/2/files/upload", {
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: "Bearer " + process.env.DROPBOX_API_TOKEN,
        "Dropbox-API-Arg": `{"path": "/hackathon-cv/${fileName}", "mode": "overwrite", "autorename": true, "mute": false}`
      },
      body: file
    });

    return result;
  };
}
