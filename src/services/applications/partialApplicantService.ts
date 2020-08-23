import { provide } from 'inversify-binding-decorators';
import { PartialApplicant } from '../../models/db/applicant';
import { PartialApplicantRepository } from '../../repositories';
import { ObjectID, Repository, DeleteResult } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';

type ApplicationID = string | number | Date | ObjectID;

export interface PartialApplicantServiceInterface {
	find(id: ApplicationID, findBy?: keyof PartialApplicant): Promise<PartialApplicant>;
	save(id: string, newApplicants: Record<string, string>, file?: Buffer): Promise<PartialApplicant | undefined>;
	remove(id: string): Promise<DeleteResult>;
}

@provide(PartialApplicantService)
export class PartialApplicantService implements PartialApplicantServiceInterface {
	private readonly _partialApplicantRepository: Repository<PartialApplicant>;

	public constructor(
		partialApplicantRepository: PartialApplicantRepository
	) {
		this._partialApplicantRepository = partialApplicantRepository.getRepository();
	}

	@Transactional()
	public async find(id: ApplicationID): Promise<PartialApplicant> {
		try {
			const partialApplicant = await this._partialApplicantRepository.findOne(id);
			if (!partialApplicant) throw new Error('Applicant does not exist');
			return partialApplicant;
		} catch (err) {
			throw new Error(`Failed to find an applicant:\n${(err as Error).message}`);
		}
	}

	@Transactional()
	public async remove(id: string): Promise<DeleteResult> {
		try {
			return await this._partialApplicantRepository.delete(id);
		} catch (err) {
			throw new Error(`Failed to remove partial application. ${(err as Error).message}`);
		}
	}

	@Transactional()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async save(id: string, rawApplication: Record<string, string>, _file?: Buffer): Promise<PartialApplicant | undefined> {
		const application = new PartialApplicant();
		application.authId = id;
		application.partialApplication = { ...rawApplication };

		try {
			return await this._partialApplicantRepository.save(application);
		} catch (err) {
			throw new Error('Failed to save/update application');
		}
	}
}
