import { initEnv, getTestDatabaseOptions } from '../../util/testUtils';
import { mockFrontendRenderer, mockRequestAuthentication, mockSettingsLoader, mockHackathonConfigCache } from '../../util/mocks';

import request from 'supertest';
import { App } from '../../../src/app';
import { Express } from 'express';
import { HttpResponseCode } from '../../../src/util/errorHandling';
import { instance, mock, when, reset } from 'ts-mockito';
import { RequestAuthentication, SettingLoader } from '../../../src/util';
import { ApplicantService, EmailService } from '../../../src/services';
import { Applicant } from '../../../src/models/db';
import { Cache } from '../../../src/util/cache';

import container from '../../../src/inversify.config';
import { ApplicantStatus } from '../../../src/services/applications/applicantStatus';
import { SendMessageEnum, ConfirmMessageEnum } from '../../../src/controllers/inviteController';

let bApp: Express;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;
let mockCache: Cache;
let mockApplicantService: ApplicantService;
let mockEService: EmailService;

const requestUser = {
	name: 'Test',
	email: 'test@test.com',
	id: '010eee101'
};

const testApplicant1: Applicant = new Applicant();
testApplicant1.authId = requestUser.id;
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

let spiedRenderer: jest.SpyInstance;
beforeAll(async () => {
	initEnv();
	spiedRenderer = mockFrontendRenderer();

	mockRequestAuth = mockRequestAuthentication(requestUser);
	mockSettingLoader = mockSettingsLoader();
	mockCache = mockHackathonConfigCache();
	mockApplicantService = mock(ApplicantService);
	mockEService = mock(EmailService);

	container.rebind(RequestAuthentication).toConstantValue(instance(mockRequestAuth));
	container.rebind(SettingLoader).toConstantValue(instance(mockSettingLoader));
	container.rebind(Cache).toConstantValue(instance(mockCache));
	container.rebind(ApplicantService).toConstantValue(instance(mockApplicantService));
	container.rebind(EmailService).toConstantValue(instance(mockEService));

	bApp = await new App().buildApp(getTestDatabaseOptions());
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
	spiedRenderer.mockReset();
	spiedRenderer = mockFrontendRenderer();
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the container
	container.restore();

	// Reset the mocks
	reset(mockApplicantService);
	reset(mockEService);
});

describe('Invite controller tests for confirm route', () => {
	beforeAll(() => {
		// Setup email service mock
		when(mockEService.sendEmail).thenReturn(() => Promise.resolve(true));
	});

	test('Test invite confirm request returns valid response', async () => {
		const confirmableApplicant = new Applicant();
		confirmableApplicant.authId = requestUser.id;
		confirmableApplicant.applicationStatus = ApplicantStatus.Invited;
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(confirmableApplicant));
		when(mockApplicantService.save).thenReturn(() => Promise.resolve(confirmableApplicant));

		// Perform the request along /invite/123/confirm
		const response = await request(bApp).get('/invite/123/confirm');

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
		expect(spiedRenderer.mock.calls[0][3].message).toBe(ConfirmMessageEnum.Confirmed);
	});

	test('Test invite confirm request returns valid response when invite expired', async () => {
		const expiredApplicant = new Applicant();
		expiredApplicant.applicationStatus = ApplicantStatus.Invited;
		expiredApplicant.inviteAcceptDeadline = new Date(Date.now() - (60 * 60 * 1000));
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(expiredApplicant));
		when(mockApplicantService.save).thenReturn(() => Promise.resolve(expiredApplicant));

		// Perform the request along /invite/123/confirm
		const response = await request(bApp).get('/invite/123/confirm');

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
		expect(spiedRenderer.mock.calls[0][3].message).toBe(ConfirmMessageEnum.Expired);
	});

	test('Test invite confirm request returns valid response when already confirmed', async () => {
		const applicant = new Applicant();
		applicant.applicationStatus = ApplicantStatus.Confirmed;
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(applicant));
		when(mockApplicantService.save).thenReturn(() => Promise.resolve(applicant));

		// Perform the request along /invite/123/confirm
		const response = await request(bApp).get('/invite/123/confirm');

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
		expect(spiedRenderer.mock.calls[0][3].message).toBe(ConfirmMessageEnum.Invalid);
	});

	test('Test invite confirm request returns valid response unknown state', async () => {
		const applicant = new Applicant();
		applicant.applicationStatus = ApplicantStatus.Invited;
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(applicant));
		when(mockApplicantService.save).thenReturn(() => Promise.resolve(applicant));

		// Perform the request along /invite/123/confirm
		const response = await request(bApp).get('/invite/123/confirm');

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
		expect(spiedRenderer.mock.calls[0][3].message).toBe(ConfirmMessageEnum.Error);
	});

	test('Test invite confirm request returns 500 response when findOne fails', async () => {
		when(mockApplicantService.findOne).thenReturn(() => Promise.reject());

		// Perform the request along /invite/123/confirm
		const response = await request(bApp).get('/invite/123/confirm');

		// Check that we get a 500 response code
		expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
	});

	test('Test invite confirm request returns error message when save fails', async () => {
		const applicant = new Applicant();
		applicant.applicationStatus = ApplicantStatus.Invited;
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(applicant));
		when(mockApplicantService.save).thenReturn(() => Promise.reject());

		// Perform the request along /invite/123/confirm
		const response = await request(bApp).get('/invite/123/confirm');

		// Check that we get a OK (200) response code
		expect(response.status).toBe(HttpResponseCode.OK);
		expect(spiedRenderer.mock.calls[0][3].message).toBe(ConfirmMessageEnum.Error);
	});
});

describe('Invite controller tests for invite send route', () => {
	beforeAll(() => {
		// Setup email service mock
		when(mockEService.sendEmail).thenReturn(() => Promise.resolve(true));
	});

	test('Test invite send request returns valid response for valid applicant states', async () => {
		for (const state of [ApplicantStatus.Applied, ApplicantStatus.Reviewed]) {
			const applicant = new Applicant();
			applicant.applicationStatus = state;
			when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(applicant));
			when(mockApplicantService.save).thenReturn(() => Promise.resolve(applicant));

			// Perform the request along /invite/123/send
			const response = await request(bApp).put('/invite/123/send');

			// Check that we get a OK (200) response code
			expect(response.status).toBe(HttpResponseCode.OK);
			expect(response.body.message).toBe(SendMessageEnum.Success);
		}
	});

	test('Test invite send request returns valid response for invalid applicant state', async () => {
		const applicant = new Applicant();
		applicant.applicationStatus = ApplicantStatus.Rejected;
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(applicant));
		when(mockApplicantService.save).thenReturn(() => Promise.resolve(applicant));

		// Perform the request along /invite/123/send
		const response = await request(bApp).put('/invite/123/send');

		expect(response.body.message).toBe(SendMessageEnum.Failed);
	});

	test('Test invite send request returns error with thrown error on findOne', async () => {
		const applicant = new Applicant();
		applicant.applicationStatus = ApplicantStatus.Applied;
		when(mockApplicantService.findOne).thenReturn(() => Promise.reject());

		// Perform the request along /invite/123/send
		const response = await request(bApp).put('/invite/123/send');

		// Check that we get a BAD_REQUEST (400) response code
		expect(response.status).toBe(HttpResponseCode.BAD_REQUEST);
		expect(response.body.message).toBe(SendMessageEnum.Error);
	});

	test('Test invite send request returns error with thrown error on save', async () => {
		const applicant = new Applicant();
		applicant.applicationStatus = ApplicantStatus.Applied;
		when(mockApplicantService.findOne).thenReturn(() => Promise.resolve(applicant));
		when(mockApplicantService.save).thenReturn(() => Promise.reject());

		// Perform the request along /invite/123/send
		const response = await request(bApp).put('/invite/123/send');

		expect(response.body.message).toBe(SendMessageEnum.Failed);
	});
});
