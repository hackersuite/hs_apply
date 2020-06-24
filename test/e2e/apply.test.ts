import request from 'supertest';
import { App } from '../../src/app';
import { Express, NextFunction } from 'express';
import { initEnv, getTestDatabaseOptions } from '../util/testUtils';
import { HttpResponseCode } from '../../src/util/errorHandling';
import container from '../../src/inversify.config';
import { Applicant } from '../../src/models/db';
import { RequestAuthentication } from '../../src/util/auth';
import { SettingLoader } from '../../src/util/fs';
import { AuthLevel } from '@unicsmcr/hs_auth_client';
import { mock, instance, when, anything } from 'ts-mockito';
import { TYPES } from '../../src/types';
import { Repository } from 'typeorm';
import { ApplicantRepository } from '../../src/repositories';

let bApp: Express;
let applicantRepository: Repository<Applicant>;
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
	id: '010101',
	authLevel: AuthLevel.Organiser
};

beforeAll(async done => {
	initEnv();

	mockRequestAuth = mock(RequestAuthentication);
	mockSettingLoader = mock(SettingLoader);

	container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));
	container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));

	when(mockRequestAuth.passportSetup).thenReturn(() => null);
	when(mockRequestAuth.checkLoggedIn).thenReturn((req, res, next: NextFunction) => {
		req.user = requestUser;
		next();
		return Promise.resolve();
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
			applicationsClose: new Date(Date.now() + (10800 * 1000)).toString() // 3 hours from now
		};
	});

	await new App().buildApp((builtApp: Express, err?: Error): void => {
		if (err) {
			done(`${err.message}\n${err.stack ?? ''}`);
		} else {
			bApp = builtApp;

			// After the application has been built and db connection established -- get the applicant repository
			applicantRepository = container.get<ApplicantRepository>(TYPES.ApplicantRepository).getRepository();
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

test('Test 404 page provided when invalid URL', async () => {
	// Perform the request along .../apply
	const response = await request(bApp).get('/invalidpage-url-123');

	// Check that we get a OK (200) response code
	expect(response.status).toBe(HttpResponseCode.OK);
});

test('Test applicant created with valid request', async () => {
	// Perform the request along .../apply
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
