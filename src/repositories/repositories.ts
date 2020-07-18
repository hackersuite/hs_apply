import { Applicant, Review } from '../models/db';
import { BaseRepository } from './baseRepository';
import { provide } from 'inversify-binding-decorators';
import { Repository } from 'typeorm';

@provide(ApplicantRepository)
export class ApplicantRepository extends BaseRepository<Applicant> {
	public getRepository(): Repository<Applicant> {
		return super.connect(Applicant);
	}
}

@provide(ReviewRepository)
export class ReviewRepository extends BaseRepository<Review> {
	public getRepository(): Repository<Review> {
		return super.connect(Review);
	}
}
