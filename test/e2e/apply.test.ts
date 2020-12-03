import { getTestDatabaseOptions } from '../util';
import { mockFrontendRenderer, mockRequestAuthentication, mockSettingsLoader, mockHackathonConfigCache } from '../util/mocks';

import request from 'supertest';
import { App } from '../../src/app';
import { Express } from 'express';
import { HttpResponseCode } from '../../src/util/errorHandling';
import { Applicant } from '../../src/models/db';
import { RequestAuthentication } from '../../src/util/auth';
import { SettingLoader } from '../../src/util/fs';
import { instance } from 'ts-mockito';
import { Repository } from 'typeorm';
import { InjectedRepository } from '../../src/repositories';

import container from '../../src/inversify.config';
import { Cache } from '../../src/util/cache';

let bApp: Express;
let applicantRepository: Repository<Applicant>;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;
let mockCache: Cache;

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
	hearAbout: 'IDK'
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
	id: '010101'
};

beforeAll(async () => {
	mockFrontendRenderer();
	mockRequestAuth = mockRequestAuthentication(requestUser);
	mockSettingLoader = mockSettingsLoader();
	mockCache = mockHackathonConfigCache();

	container.rebind(RequestAuthentication).toConstantValue(instance(mockRequestAuth));
	container.rebind(SettingLoader).toConstantValue(instance(mockSettingLoader));
	container.rebind(Cache).toConstantValue(instance(mockCache));

	bApp = await new App().buildApp(getTestDatabaseOptions());
	// After the application has been built and db connection established -- get the applicant repository
	applicantRepository = container.get(InjectedRepository).getRepository(Applicant);
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the application container
	container.restore();
});

test('Test 404 page provided when invalid URL', async () => {
	// Perform the request along an invalid page URL
	const response = await request(bApp).get('/invalidpage-url-123');

	// Check that we get a NOT_FOUND (404) response code
	expect(response.status).toBe(HttpResponseCode.NOT_FOUND);
});

test('Test application created with valid request', async () => {
	// Perform the request along /apply
	const response = await request(bApp)
		.post('/apply')
		.send(newApplicantRequest);
	// Check that we get a OK (200) response code
	expect(response.status).toBe(HttpResponseCode.OK);

	// Check that the application has been added to the database
	const createdApplicant: Applicant = await applicantRepository.findOne({ authId: requestUser.id });
	expect(createdApplicant.authId).toBe(requestUser.id);
	expect(createdApplicant.age).toBe(newApplicantRequest.age);
	expect(createdApplicant.city).toBe(newApplicantRequest.city);
	expect(createdApplicant.degree).toBe(newApplicantRequest.degree);
});
