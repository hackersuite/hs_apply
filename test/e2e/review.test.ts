import request from 'supertest';
import { App } from '../../src/app';
import { Express, NextFunction } from 'express';
import { initEnv, getTestDatabaseOptions } from '../util/testUtils';
import { HttpResponseCode } from '../../src/util/errorHandling';
import container from '../../src/inversify.config';
import { Applicant, Review } from '../../src/models/db';
import { RequestAuthentication } from '../../src/util/auth';
import { SettingLoader } from '../../src/util/fs';
import { AuthLevel } from '@unicsmcr/hs_auth_client';
import { mock, instance, when, anything, objectContaining } from 'ts-mockito';
import { TYPES } from '../../src/types';
import { Repository } from 'typeorm';
import { ReviewRepository } from '../../src/repositories';
import { ApplicantService } from '../../src/services';

let bApp: Express;
let reviewRepository: Repository<Review>;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;
let mockApplicantService: ApplicantService;

const newReviewRequest: any = {
	applicationID: '',
	averageScore: 2.0
};

const testApplicant: Applicant = new Applicant();
testApplicant.age = 20;
testApplicant.gender = 'Test';
testApplicant.nationality = 'UK';
testApplicant.country = 'UK';
testApplicant.city = 'Manchester';
testApplicant.university = 'UoM';
testApplicant.degree = 'CS';
testApplicant.yearOfStudy = 'Foundation';
testApplicant.workArea = 'This';
testApplicant.hackathonCount = 0;
testApplicant.dietaryRequirements = 'Test';
testApplicant.tShirtSize = 'M';
testApplicant.hearAbout = 'IDK';

const requestUser = {
	name: 'Test',
	email: 'test@test.com',
	id: '010101',
	authLevel: AuthLevel.Organiser
};

beforeAll(done => {
	initEnv();

	mockRequestAuth = mock(RequestAuthentication);
	mockSettingLoader = mock(SettingLoader);
	mockApplicantService = mock(ApplicantService);

	container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));
	container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));
	container.rebind(TYPES.ApplicantService).toConstantValue(instance(mockApplicantService));

	when(mockRequestAuth.passportSetup).thenReturn(() => null);
	when(mockRequestAuth.checkLoggedIn).thenReturn(async (req, res, next: NextFunction) => {
		req.user = requestUser;
		next();
	});
	when(mockRequestAuth.checkIsOrganiser).thenReturn((req, res, next: NextFunction) => {
		next();
	});
	when(mockRequestAuth.checkIsVolunteer).thenReturn((req, res, next: NextFunction) => {
		next();
	});
	when(mockRequestAuth.checkIsAttendee).thenReturn((req, res, next: NextFunction) => {
		next();
	});
	when(mockSettingLoader.loadApplicationSettings(anything())).thenCall((app: Express) => {
		app.locals.settings = {
			shortName: 'Hackathon',
			fullName: 'Hackathon',
			applicationsOpen: new Date().toString(),
			applicationsClose: new Date(Date.now() + 10800 * 1000).toString() // 3 hours from now
		};
	});
	when(mockApplicantService.findOne(objectContaining({ id: '' }))).thenReturn(Promise.resolve(testApplicant));

	new App().buildApp((builtApp: Express, err: Error): void => {
		if (err) {
			done(`${err.message}\n${err.stack}`);
		} else {
			bApp = builtApp;

			// After the application has been built and db connection established -- get the applicant repository
			reviewRepository = container.get<ReviewRepository>(TYPES.ReviewRepository).getRepository();
			done();
		}
	}, getTestDatabaseOptions());
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the application container
	container.restore();
});

test('Test review created with valid request', async () => {
	// Perform the request along .../review/submit
	const response = await request(bApp)
		.post('/review/submit')
		.send(newReviewRequest);
	// Check that we get a OK (200) response code
	expect(response.status).toBe(HttpResponseCode.OK);

	// Check that the application has been added to the database
	const createdReview: Review = await reviewRepository.findOne({ createdByAuthID: requestUser.id });

	expect(createdReview.averageScore).toBe(newReviewRequest.averageScore);
	expect(createdReview.createdByAuthID).toBe(requestUser.id);
	expect(createdReview.id).toBeDefined();
	expect(createdReview.createdAt).toBeInstanceOf(Date);
});
