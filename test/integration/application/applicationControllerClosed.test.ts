import { initEnv, getTestDatabaseOptions } from '../../util';
import { mockRequestAuthentication, mockSettingsLoader, mockEmailService, mockHackathonConfigCache, mockFrontendRenderer } from '../../util/mocks';

import request from 'supertest';
import { Express } from 'express';
import { HttpResponseCode } from '../../../src/util/errorHandling';
import { instance, mock, when, reset, objectContaining, verify } from 'ts-mockito';
import { Cache } from '../../../src/util/cache';
import { ApplicantService, EmailService } from '../../../src/services';
import { Sections } from '../../../src/models/sections';
import { Applicant } from '../../../src/models/db';
import { RequestAuthentication } from '../../../src/util/auth';
import { SettingLoader } from '../../../src/util/fs/loader';
import { ApplicantStatus } from '../../../src/services/applications/applicantStatus';
import { App } from '../../../src/app';

import container from '../../../src/inversify.config';

let bApp: Express;
let mockCache: Cache;
let mockEService: EmailService;
let mockApplicantService: ApplicantService;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;

const newApplicantRequest: any = {
	age: 20,
	gender: 'Other',
	genderOther: 'Test',
	nationality: 'UK',
	country: 'UK',
	city: 'Manchester',
	university: 'UoM',
	degree: 'CS',
	yearOfStudy: 'Foundation',
	workArea: 'Other',
	workAreaOther: 'This',
	hackathonCount: 0,
	dietaryRequirements: 'Other',
	dietaryRequirementsOther: 'Test',
	tShirtSize: 'M',
	hearAbout: 'Other'
};
const testApplicant: Applicant = new Applicant();
testApplicant.age = 20;
testApplicant.gender = 'Test';
testApplicant.nationality = 'UK';
testApplicant.country = 'UK';
testApplicant.city = 'Manchester';
testApplicant.university = 'UoM';
testApplicant.yearOfStudy = 'Foundation';
testApplicant.workArea = 'This';
testApplicant.hackathonCount = 0;
// testApplicant.skills = testApplicant.whyChooseHacker = testApplicant.pastProjects = testApplicant.hardwareRequests = undefined;
testApplicant.dietaryRequirements = 'Test';
testApplicant.tShirtSize = 'M';
testApplicant.hearAbout = 'Other';

const requestUser = {
	name: 'Test',
	email: 'test@test.com',
	id: '01010111'
};

const getUniqueApplicant = (): [any, Applicant] => {
	// Create a unique applicant using current time
	const applicantIdentifier = new Date().getTime().toString();
	const applicant: Applicant = { ...testApplicant, city: applicantIdentifier };
	const applicantRequest = { ...newApplicantRequest, city: applicantIdentifier };

	// Add fields that are added in the controller
	applicant.authId = requestUser.id;
	applicant.applicationStatus = ApplicantStatus.Applied;

	return [applicantRequest, applicant];
};

beforeAll(async () => {
	initEnv();
	mockFrontendRenderer();

	mockCache = mockHackathonConfigCache();
	mockRequestAuth = mockRequestAuthentication(requestUser);
	mockSettingLoader = mockSettingsLoader({ applicationsOpen: false });
	mockEService = mockEmailService();
	mockApplicantService = mock(ApplicantService);

	container.rebind(Cache).toConstantValue(instance(mockCache));
	container.rebind(RequestAuthentication).toConstantValue(instance(mockRequestAuth));
	container.rebind(SettingLoader).toConstantValue(instance(mockSettingLoader));
	container.rebind(EmailService).toConstantValue(instance(mockEService));
	container.rebind(ApplicantService).toConstantValue(instance(mockApplicantService));

	bApp = await new App().buildApp(getTestDatabaseOptions());
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
});

afterEach(() => {
	// Reset the mocks
	reset(mockApplicantService);

	// Restore to last snapshot so each unit test takes a clean copy of the application container
	container.restore();
});

test('Test application page redirects when applications closed', async () => {
	// Mock out the cache and question loader
	when(mockCache.getAll(Sections.name)).thenReturn([new Sections([])]);

	// Perform the request along /apply
	const response = await request(bApp).get('/apply');

	// Check that we get a REDIRECT (302) response code
	verify(mockApplicantService.findOne(requestUser.id, 'authId')).never();
	expect(response.status).toBe(HttpResponseCode.REDIRECT);
});

test('Test applicant not created with valid request, applications closed', async () => {
	const [applicantRequest, applicant] = getUniqueApplicant();
	when(mockApplicantService.save(objectContaining(applicant), undefined)).thenResolve(applicant);

	// Perform the request along .../apply
	const response = await request(bApp)
		.post('/apply')
		.send({ applicantRequest });

	// Check that we get a REDIRECT (302) response code
	verify(mockApplicantService.save(objectContaining(applicant), undefined)).never();
	expect(response.status).toBe(HttpResponseCode.REDIRECT);
});

test('Test application cancelled when applications closed', async () => {
	const [, applicant] = getUniqueApplicant();
	when(mockApplicantService.findOne(requestUser.id, 'authId')).thenResolve(applicant);
	when(mockApplicantService.delete(applicant.id)).thenReject();

	// Perform the request along /apply/cancel
	const response = await request(bApp).get('/apply/cancel');

	// Check that we get a REDIRECT (302) response code
	verify(mockApplicantService.findOne(requestUser.id, 'authId')).once();
	verify(mockApplicantService.delete(applicant.id)).never();
	expect(response.status).toBe(HttpResponseCode.REDIRECT);
	expect(applicant.applicationStatus).toBe(ApplicantStatus.Cancelled);
});

test.skip("Test error thrown when cancel application and doesn't exist", async () => {
	expect.assertions(1);

	const [, applicant] = getUniqueApplicant();
	when(mockApplicantService.findOne(requestUser.id, 'authId')).thenThrow();

	// Perform the request along /apply/cancel
	const response = await request(bApp).get('/apply/cancel');

	// Check that we get a INTERNAL ERROR (500) response code
	verify(mockApplicantService.delete(applicant.id)).never();
	expect(response.status).toBe(HttpResponseCode.INTERNAL_ERROR);
});
