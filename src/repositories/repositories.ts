import { Applicant, Review, PartialApplicant } from '../models/db';
import { provide } from 'inversify-binding-decorators';
import { TransactionRepository } from './transactionRepository';
import { Repository } from 'typeorm';

@provide(ApplicantRepository)
export class ApplicantRepository extends TransactionRepository<Applicant> {
	public getRepository(): Repository<Applicant> {
		return super.manager.getRepository(Applicant);
	}
}

@provide(PartialApplicantRepository)
export class PartialApplicantRepository extends TransactionRepository<PartialApplicant> {
	public getRepository(): Repository<PartialApplicant> {
		return super.manager.getRepository(PartialApplicant);
	}
}

@provide(ReviewRepository)
export class ReviewRepository extends TransactionRepository<Review> {
	public getRepository(): Repository<Review> {
		return super.manager.getRepository(Review);
	}
}
