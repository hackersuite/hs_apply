import { Applicant } from "../models/db";
import { BaseRepository } from "./baseRepository";
import { injectable } from "inversify";

@injectable()
export class ApplicationRepository extends BaseRepository<Applicant> {
  constructor() { super(Applicant); }
}
