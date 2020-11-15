import { Request, Response, NextFunction } from 'express';
import autoBind from 'auto-bind';
import { Cache } from '../util/cache';
import { provide } from 'inversify-binding-decorators';
import { Applicant } from '../models/db';
import { ApplicantService } from '../services';
import { User } from '@unicsmcr/hs_auth_client';
import { ApplicantStatus } from '../services/applications/applicantStatus';
import { CommonController } from './commonController';
import * as pages from '../views/page';

export interface DashboardControllerInterface {
	dashboard: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@provide(DashboardController)
export class DashboardController extends CommonController implements DashboardControllerInterface {
	private readonly _cache: Cache;
	private readonly _applicantService: ApplicantService;

	public constructor(
		cache: Cache,
		applicantService: ApplicantService
	) {
		super();
		this._cache = cache;
		this._applicantService = applicantService;

		autoBind(this);
	}

	public async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
		let applicant: Applicant|undefined;
		try {
			applicant = await this._applicantService.findOne((req.user as User).id, 'authId');
		} catch (err) {
			if (!(err?.message as string).includes('Applicant does not exist')) {
				return next(err);
			}
		}

		const applicationStatus: ApplicantStatus = applicant?.applicationStatus ?? ApplicantStatus.Verified;

		// Check that the applications are still open
		// Get the open and close time from the predefined settings and compare to the current time
		const applicationsOpenTime: number = new Date(req.app.locals.settings.applicationsOpen).getTime();
		const applicationsCloseTime: number = new Date(req.app.locals.settings.applicationsClose).getTime();
		const currentTime: number = new Date().getTime();
		const applicationsOpen: boolean = currentTime >= applicationsOpenTime && currentTime <= applicationsCloseTime;

		void super.renderPage(req, res, pages.dashboard, {
			applicationStatus: applicationStatus,
			applicantName: (req.user as User).name,
			applicationsOpen: applicationsOpen
		});
	}
}
