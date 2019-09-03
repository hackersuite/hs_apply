import { injectable, inject } from "inversify";
import { Applicant } from "../../models/db/applicant";
import { ApplicationRepository } from "../../repositories";
import { TYPES } from "../../types";
import { ObjectID, Repository } from "typeorm";

type ApplicationID = string | number | Date | ObjectID;

export interface IApplicationService {
  getAll: () => Promise<Applicant[]>;
  findOne: (id: ApplicationID) => Promise<Applicant>;
  save: (newApplicants: Applicant | Applicant[]) => Promise<Applicant[]>;
}

@injectable()
export class ApplicationService implements IApplicationService {
  private _applicationRepository: Repository<Applicant>;

  public constructor(
    @inject(TYPES.ApplicationRepository) applicationRepository: ApplicationRepository
  ) {
    this._applicationRepository = applicationRepository.repository;
  }

  public getAll = async (): Promise<Applicant[]> => {
    return await this._applicationRepository.find();
  }
  public findOne = async (id: ApplicationID): Promise<Applicant>  => {
    return await this._applicationRepository.findOne(id);
  }
  public save = async (newApplicants: Applicant[]): Promise<Applicant[]> => {
    let savedApplicants: Applicant[];
    try {
      savedApplicants = await this._applicationRepository.save(newApplicants);
    } catch {}
    return savedApplicants;
  }

}