import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { ApplicantRepository, ReviewRepository } from './repositories';

const repositories = new ContainerModule(
	(
		bind: interfaces.Bind
	) => {
		bind<ApplicantRepository>(TYPES.ApplicantRepository).to(ApplicantRepository);
		bind<ReviewRepository>(TYPES.ReviewRepository).to(ReviewRepository);
	}
);

export default repositories;
