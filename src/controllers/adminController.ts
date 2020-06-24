import fs from 'fs';

import { Request, Response, NextFunction, application } from 'express';
import { Cache } from '../util/cache';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ApplicantService } from '../services';
import { Applicant } from '../models/db';
import { ApplicantStatus } from '../services/applications/applicantStatus';
import { getUsers, User } from '@unicsmcr/hs_auth_client';
import { CloudStorageService } from '../services/cloudStorage/cloudStorageService';
import { createWriteableStream, WriteableStreamCallback, CleanupCallback, logger } from '../util';
import { HttpResponseCode } from '../util/errorHandling';
import { PassThrough } from 'stream';

export interface AdminControllerInterface {
	overview: (req: Request, res: Response, next: NextFunction) => void;
	manage: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for admin methods
 */
@injectable()
export class AdminController implements AdminControllerInterface {
	private readonly _applicantService: ApplicantService;
	private readonly _cloudStorageService: CloudStorageService;
	private readonly _cache: Cache;

	public constructor(
	@inject(TYPES.ApplicantService) applicantService: ApplicantService,
		@inject(TYPES.CloudStorageService) cloudStorageService: CloudStorageService,
		@inject(TYPES.Cache) cache: Cache
	) {
		this._cache = cache;
		this._applicantService = applicantService;
		this._cloudStorageService = cloudStorageService;
	}

	public overview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		let applications: Partial<Applicant>[]; let totalApplications: number;
		try {
			[applications, totalApplications] = await this._applicantService.getAllAndCountSelection(
				[
					'gender',
					'tShirtSize',
					'createdAt',
					'dietaryRequirements',
					'hardwareRequests',
					'university',
					'applicationStatus'
				],
				'createdAt',
				'ASC'
			);
		} catch (err) {
			return next('Failed to get applications overview');
		}

		// Create an array of the application times
		const createdAtTimes: Date[] = applications.map(applicant => applicant.createdAt!);

		// Create the map of genders and their respective count
		const genders = { Male: 0, Female: 0, Other: 0 };
		let genderSlice: 'Male' | 'Female' | 'Other';

		// Create a map of T-Shirt sizes and their count
		const tShirts = {
			XS: 0,
			S: 0,
			M: 0,
			L: 0,
			XL: 0,
			XXL: 0
		};

		// Create a map for the dietry requirements
		const dietryReq: Record<string, number> = {};

		// Create a map to contain the universities and counts
		const university: Record<string, number> = {};

		// Create a map to contain the application status stats
		const appStatus: Record<string, number> = {};
		let applicationStatusValue: string;

		// Create an array with all the hardware requests
		const hardwareReq: string[] = [];

		applications.forEach(applicant => {
			genderSlice = applicant.gender === 'Male' || applicant.gender === 'Female' ? applicant.gender : 'Other';
			genders[genderSlice]++;

			const tShirtSize = applicant.tShirtSize! as 'XS'|'S'|'M'|'L'|'XL'|'XXL';
			tShirts[tShirtSize] = 1 + (tShirts[tShirtSize] ?? 0);

			dietryReq[applicant.dietaryRequirements!] = 1 + (dietryReq[applicant.dietaryRequirements!] ?? 0);

			if (
				applicant.hardwareRequests &&
        applicant.hardwareRequests !== 'None' &&
        applicant.hardwareRequests !== 'Nothing'
			) {
				hardwareReq.push(applicant.hardwareRequests);
			}

			university[applicant.university!] = 1 + (university[applicant.university!] ?? 0);

			applicationStatusValue = ApplicantStatus[applicant.applicationStatus!];
			appStatus[applicationStatusValue] = 1 + (appStatus[applicationStatusValue] || 0);
		});

		res.render('pages/admin/adminOverview', {
			totalApplications,
			applicationTimes: createdAtTimes,
			applicationGenders: genders,
			applicationTShirts: tShirts,
			applicationDietry: dietryReq,
			applicationHardwareReq: hardwareReq,
			applicationUniversity: university,
			applicationStatus: appStatus
		});
	};

	public manage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		let authUsersResult: User[];
		try {
			authUsersResult = await getUsers(req.cookies['Authorization']);
		} catch (err) {
			next(err);
			return;
		}

		const columnsToSelect: (keyof Applicant)[] = [
			'id',
			'authId',
			'university',
			'yearOfStudy',
			'applicationStatus',
			'createdAt'
		];
		const columnNames: object[] = [['Name'], ['Email'], ['University'], ['Year'], ['Status'], ['Manage']];
		const applications: Applicant[] = await this._applicantService.getAll(columnsToSelect);

		const authUsers: Record<string, User> = {};
		authUsersResult.forEach(a => {
			authUsers[a.id] = { ...a };
		});

		const combinedApplications: any = [];
		applications.forEach(a => {
			combinedApplications.push({
				...a,
				...authUsers[a.authId!],
				applicationStatus: ApplicantStatus[a.applicationStatus]
			});
		});

		res.render('pages/admin/adminManage', {
			applicationRows: columnNames,
			applications: combinedApplications
		});
	};

	public manageApplication = async (req: Request, res: Response): Promise<void> => {
		const specifiedApplicant: Applicant = await this._applicantService.findOne(req.url.split('/')[2]);
		res.render('pages/manageApplication', {
			applicant: specifiedApplicant
		});
	};

	public downloadCSV = async (req: Request, res: Response): Promise<void> => {
		let allApplicants: Partial<Applicant>[];
		try {
			const allApplicantsAndCount = await this._applicantService.getAllAndCountSelection(
				['id', 'authId', 'whyChooseHacker', 'skills', 'pastProjects', 'degree', 'createdAt'],
				'createdAt',
				'ASC'
			);
			allApplicants = allApplicantsAndCount[0];
		} catch (err) {
			res.send('Failed to get the applications!');
			return;
		}

		let authUsersResult: User[];
		try {
			authUsersResult = await getUsers(req.cookies['Authorization']);
		} catch (err) {
			res.send('Failed to get the users authentication info!');
			return;
		}

		const authUsers: Record<string, User> = {};
		// Expand the auth user to use the auth id as the key for each object
		authUsersResult.forEach(a => {
			authUsers[a.id] = { ...a };
		});

		let csvContents = '';
		allApplicants.forEach(application => {
			// UID, TID, WhyChoose?, Proj, Skills, Degree
			const team: string = authUsers[application.authId!].team ?? '';
			application.whyChooseHacker = this.escapeForCSV(application.whyChooseHacker!);
			application.pastProjects = this.escapeForCSV(application.pastProjects!);
			application.skills = this.escapeForCSV(application.skills!);
			csvContents += `${application.createdAt},${application.id},${team},"${application.whyChooseHacker}","${application.pastProjects}","${application.skills}","${application.degree}"\n`;
		});
		const csvStream = new PassThrough();
		csvStream.end(Buffer.from(csvContents));
		res.set('Content-Disposition', 'attachment; filename=voting.csv');
		res.set('Content-Type', 'text/csv');
		csvStream.pipe(res).on('error', err => {
			logger.error(`File transfer failed! ${err.message}`);
		});
	};

	private readonly escapeForCSV = (input: string): string => input ? input.replace(/"/g, '') : '';

	public downloadAllCVsFromDropbox = async (req: Request, res: Response): Promise<void> => {
		const downloadFileName = 'dropbox-cv.zip';

		// Create the callback function that is executed once the stream is closed
		const onStreamComplete: WriteableStreamCallback = (cleanup: CleanupCallback): void => {
			res.download(downloadFileName, err => {
				// Call the provided cleanup function, err is undefined if nothing broke
				cleanup(err);
			});
		};

		// Create a new writeable stream, we provide a filename and the callback function above
		const stream: fs.WriteStream = createWriteableStream(downloadFileName, onStreamComplete);

		// Make the request to the Dropbox API for the byte stream
		// The stream is closed automatically when the API call is completed
		try {
			await this._cloudStorageService.downloadAll(stream);
		} catch (err) {
			// If an error occured, make sure to clean up the stream
			stream.destroy(new Error(err.message));
			res.status(HttpResponseCode.INTERNAL_ERROR).send(err.message);
		}
	};
}
