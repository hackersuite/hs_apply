import request from 'supertest';
import { App } from '../../../src/app';
import { Express, NextFunction } from 'express';
import { initEnv, getTestDatabaseOptions } from '../../util/testUtils';
import { HttpResponseCode } from '../../../src/util/errorHandling';
import { instance, mock, when, anything, reset, verify } from 'ts-mockito';
import container from '../../../src/inversify.config';
import { TYPES } from '../../../src/types';
import { RequestAuthentication, SettingLoader, logger } from '../../../src/util';
import { AuthLevel } from '@unicsmcr/hs_auth_client';
import { ApplicantService, ReviewService } from '../../../src/services';
import { Applicant } from '../../../src/models/db';

let bApp: Express;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;
let mockApplicantService: ApplicantService;
let mockReviewService: ReviewService;

const testApplicant1: Applicant = new Applicant();
testApplicant1.age = 20;
testApplicant1.gender = 'Test';
testApplicant1.nationality = 'UK';
testApplicant1.country = 'UK';
testApplicant1.city = 'Manchester';
testApplicant1.university = 'UoM';
testApplicant1.yearOfStudy = 'Foundation';
testApplicant1.workArea = 'This';
testApplicant1.hackathonCount = 0;
testApplicant1.dietaryRequirements = 'Test';
testApplicant1.tShirtSize = 'M';
testApplicant1.hearAbout = 'Other';

const requestUser = {
	name: 'Test',
	email: 'test@test.com',
	id: '010eee101',
	authLevel: AuthLevel.Organiser
};

beforeAll(done => {
	initEnv();
	mockRequestAuth = mock(RequestAuthentication);
	mockSettingLoader = mock(SettingLoader);
	mockApplicantService = mock(ApplicantService);
	mockReviewService = mock(ReviewService);

	container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));

	container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));

	container.rebind(TYPES.ApplicantService).toConstantValue(instance(mockApplicantService));

	container.rebind(TYPES.ReviewService).toConstantValue(instance(mockReviewService));

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

	new App().buildApp((builtApp: Express, err: Error): void => {
		if (err) {
			done(`${err.message}\n${err.stack}`);
		} else {
			bApp = builtApp;
			done();
		}
	}, getTestDatabaseOptions());
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
});

afterEach(() => {
	// Reset the mocks
	reset(mockApplicantService);
	reset(mockReviewService);

	// Restore to last snapshot so each unit test takes a clean copy of the container
	container.restore();
});

describe('Review page tests', () => {
	test('Test review page loads', async () => {
		// Perform the request along /review
		const response = await request(bApp).get('/review');

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
	});

	// TODO: Add auth tests
	test.skip('Test review page inaccessible to attendees', async () => {
		// Setup test authentication as Attendee
		when(mockRequestAuth.checkLoggedIn).thenReturn(async (req, res, next: NextFunction) => {
			req.user = { ...requestUser, authLevel: AuthLevel.Attendee };
			logger.info(req.user);
			next();
		});
		when(mockRequestAuth.checkIsVolunteer).thenReturn((req, res, next: NextFunction) => {
			if ((req.user as typeof requestUser).authLevel < AuthLevel.Volunteer) {
				res.redirect('/test');
				return;
			}
			next();
		});

		// Perform the request along /review
		const response = await request(bApp).get('/review');

		// Check that we get a REDIRECT (302) response code
		expect(response.status).toBe(HttpResponseCode.REDIRECT);
	});
});

describe('Next review endpoint tests', () => {
	beforeEach(() => {
		// Setup review service mock
		when(mockReviewService.getNextApplication).thenReturn(() => Promise.resolve(testApplicant1));
		when(mockReviewService.getReviewCountByAuthID).thenReturn(() => Promise.resolve(0));
	});

	test('Test next review request returns valid response', async () => {
		// Perform the request along /review/next
		const response = await request(bApp).get('/review/next');
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.application).toStrictEqual({
			...testApplicant1
		});
		expect(resBody.reviewFields).toBeTruthy();
		expect(resBody.totalReviews).toBe(0);

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
	});

	test('Test next review request returns error on getNextApplication error', async () => {
		// Setup review service mock
		when(mockReviewService.getNextApplication).thenReturn(() => {
			throw new Error();
		});

		// Perform the request along /review/next
		const response = await request(bApp).get('/review/next');
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		// Check that we get a INTERNAL_ERROR (500) response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});

	test('Test next review request returns error on getReviewCount error', async () => {
		// Setup review service mock
		when(mockReviewService.getReviewCountByAuthID).thenReturn(() => {
			throw new Error();
		});

		// Perform the request along /review/next
		const response = await request(bApp).get('/review/next');
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		// Check that we get a INTERNAL_ERROR (500) response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});
});

describe('Submit review endpoint tests', () => {
	beforeEach(() => {
		// Setup review service mock
		when(mockReviewService.getReviewCountByApplicantID).thenReturn(() => Promise.resolve(0));
		when(mockReviewService.save).thenReturn(() => Promise.resolve(undefined));

		// Setup applicant service mock
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(testApplicant1));
		when(mockApplicantService.save).thenReturn(() => Promise.resolve(undefined));
	});

	test('Test submit review request, valid response for applicant, with 0 reviews', async () => {
		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({ id: '1', averageScore: '2.0' });
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		// Check that we didn't update the applicant state
		verify(mockApplicantService.save).never();

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
	});

	test('Test submit review request, valid response for applicant, with 1 review', async () => {
		when(mockReviewService.getReviewCountByApplicantID).thenReturn(() => Promise.resolve(1));

		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({
				id: '1',
				averageScore: '2.0'
			});
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		// Check that we updated the applicant state
		verify(mockApplicantService.save).once();

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
	});

	test('Test submit review request, valid response for applicant, with 1 review', async () => {
		when(mockReviewService.getReviewCountByApplicantID).thenReturn(() => Promise.resolve(1));

		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({
				id: '1',
				averageScore: '2.0'
			});
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		// Check that we updated the applicant state
		verify(mockApplicantService.save).once();

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
	});

	test('Test submit review request, error response when find fails', async () => {
		when(mockApplicantService.findOne).thenReturn(() => {
			throw new Error('');
		});

		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({
				id: '1',
				averageScore: '2.0'
			});
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		// Check that we didn't update the applicant state
		verify(mockApplicantService.save).never();
		verify(mockReviewService.save).never();

		// Check that we get a INTERNAL_ERROR (500) response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});

	test('Test submit review request, error response when getReviewCount fails', async () => {
		when(mockReviewService.getReviewCountByApplicantID).thenReturn(() => {
			throw new Error('');
		});

		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({
				id: '1',
				averageScore: '2.0'
			});
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		verify(mockApplicantService.findOne).once();
		verify(mockReviewService.getReviewCountByApplicantID).once();
		verify(mockApplicantService.save).never();
		verify(mockReviewService.save).never();

		// Check that we get a INTERNAL_ERROR (500) response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});

	test('Test submit review request, error response when save applicant fails', async () => {
		when(mockReviewService.getReviewCountByApplicantID).thenReturn(() => Promise.resolve(2));
		when(mockApplicantService.save).thenReturn(() => {
			throw new Error('');
		});

		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({
				id: '1',
				averageScore: '2.0'
			});
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		verify(mockApplicantService.findOne).once();
		verify(mockReviewService.getReviewCountByApplicantID).once();
		verify(mockApplicantService.save).once();
		verify(mockReviewService.save).never();

		// Check that we get a INTERNAL_ERROR (500) response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});

	test('Test submit review request, error response when save applicant fails', async () => {
		when(mockReviewService.save).thenReturn(() => {
			throw new Error('');
		});

		// Perform the request along /review/submit
		const response = await request(bApp)
			.post('/review/submit')
			.send({
				id: '1',
				averageScore: '2.0'
			});
		const resBody = response.body;

		// Check the response body is valid
		expect(resBody.message).toBeTruthy();

		verify(mockApplicantService.findOne).once();
		verify(mockReviewService.getReviewCountByApplicantID).once();
		verify(mockApplicantService.save).never();
		verify(mockReviewService.save).once();

		// Check that we get a INTERNAL_ERROR (500) response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});
});
