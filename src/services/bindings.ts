import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { ApplicantServiceInterface, ApplicantService, EmailServiceInterface, EmailService, ReviewService, CloudStorageServiceInterface, CloudStorageService } from '.';
import { ReviewServiceInterface } from './review/reviewService';

const services = new ContainerModule(
	(
		bind: interfaces.Bind
	) => {
		bind<ApplicantServiceInterface>(TYPES.ApplicantService).to(ApplicantService);
		bind<EmailServiceInterface>(TYPES.EmailService).to(EmailService);
		bind<ReviewServiceInterface>(TYPES.ReviewService).to(ReviewService);
		bind<CloudStorageServiceInterface>(TYPES.CloudStorageService).to(CloudStorageService);
	}
);

export default services;
