import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ReviewService, ApplicantService } from '../services';
import { Applicant, Review } from '../models/db';
import { HttpResponseCode } from '../util/errorHandling';
import { User } from '@unicsmcr/hs_auth_client';
import { reviewApplicationMapping } from '../util';
import { ApplicantStatus } from '../services/applications/applicantStatus';

export interface ReviewControllerInterface {
	submit: (req: Request, res: Response) => Promise<void>;
	reviewPage: (req: Request, res: Response) => Promise<void>;
	nextReview: (req: Request, res: Response) => Promise<void>;
}

/**
 * A controller for review methods
 */
@injectable()
export class ReviewController implements ReviewControllerInterface {
	private readonly _reviewService: ReviewService;
	private readonly _applicantService: ApplicantService;

	public constructor(
	@inject(TYPES.ReviewService) reviewService: ReviewService,
		@inject(TYPES.ApplicantService) applicantService: ApplicantService
	) {
		this._reviewService = reviewService;
		this._applicantService = applicantService;
	}

	public reviewPage = async (req: Request, res: Response): Promise<void> => {
		res.render('pages/review/review');
		return Promise.resolve();
	};

	public nextReview = async (req: Request, res: Response): Promise<void> => {
		let nextApplication: Applicant | undefined;
		try {
			nextApplication = await this._reviewService.getNextApplication((req.user as User).id);
			if (!nextApplication) throw new Error('No new application');
		} catch (err) {
			res.status(HttpResponseCode.INTERNAL_ERROR).send({ message: 'Failed to get another application' });
			return;
		}

		let totalReviewsByUser: number;
		try {
			totalReviewsByUser = await this._reviewService.getReviewCountByAuthID((req.user as User).id);
		} catch (err) {
			res.status(HttpResponseCode.INTERNAL_ERROR).send({ message: 'Failed to get another application' });
			return;
		}

		res.send({
			application: nextApplication,
			reviewFields: Array.from(reviewApplicationMapping),
			totalReviews: totalReviewsByUser
		});
	};

	public submit = async (req: Request, res: Response): Promise<void> => {
		const { applicationID, averageScore } = req.body;

		// Find the applicant by the provided ID
		let application: Applicant;
		try {
			application = await this._applicantService.findOne(applicationID);
		} catch (err) {
			res.status(HttpResponseCode.INTERNAL_ERROR).send({
				message: 'Failed to save application review'
			});
			return;
		}

		const newReview = new Review();
		newReview.createdByAuthID = (req.user as User).id;
		newReview.applicant = application;
		newReview.averageScore = averageScore;

		let reviewCountForApplicant;
		try {
			reviewCountForApplicant = await this._reviewService.getReviewCountByApplicantID(applicationID);
		} catch (err) {
			res.status(HttpResponseCode.INTERNAL_ERROR).send({
				message: 'Failed to get review count'
			});
			return;
		}

		// Only update the application state when they have had at least one review
		if (reviewCountForApplicant >= 1) {
			application.applicationStatus = ApplicantStatus.Reviewed;
			try {
				await this._applicantService.save(application);
			} catch (err) {
				res.status(HttpResponseCode.INTERNAL_ERROR).send({
					message: 'Failed to update applicant with reviewed state'
				});
				return;
			}
		}

		try {
			await this._reviewService.save(newReview);
		} catch (err) {
			res.status(HttpResponseCode.INTERNAL_ERROR).send({
				message: 'Failed to save application review'
			});
			return;
		}

		res.send({ message: 'Saved review' });
	};
}
