import { injectable, inject } from "inversify";
import { Applicant } from "../../models/db/applicant";
import { ApplicationRepository } from "../../repositories";
import { TYPES } from "../../types";

export interface IApplicationService {
  getAllApplicants: () => Promise<Applicant[]>;
  getApplicant: () => Promise<Applicant>;
  createApplicant: () => Promise<Applicant[]>;
}

@injectable()
export class ApplicationService implements IApplicationService {
  @inject(TYPES.ApplicationRepository)
  private applicantRepository: ApplicationRepository;

  public getAllApplicants = async (): Promise<Applicant[]> => {
    throw new Error("Method not implemented.");
  }
  public getApplicant = async (): Promise<Applicant>  => {
    throw new Error("Method not implemented.");
  }
  public createApplicant = async (): Promise<Applicant[]> => {
    throw new Error("Method not implemented.");
  }

}