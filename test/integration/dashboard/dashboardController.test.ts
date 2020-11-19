import { getTestDatabaseOptions, initEnv } from '../../util/testUtils';
import { mockFrontendRenderer, mockRequestAuthentication, mockHackathonConfigCache, mockSettingsLoader } from '../../util/mocks';
import request from 'supertest';
import { App } from '../../../src/app';
import { Express } from 'express';
import { HttpResponseCode } from '../../../src/util/errorHandling';
import { instance } from 'ts-mockito';
import { Cache } from '../../../src/util/cache';
import { RequestAuthentication, SettingLoader } from '../../../src/util';

import container from '../../../src/inversify.config';

let bApp: Express;
let mockCache: Cache;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;

const requestUser = {
	name: 'Test',
	email: 'test@test.com',
	id: '010101'
};

beforeAll(async () => {
	initEnv();
	mockFrontendRenderer();

	mockCache = mockHackathonConfigCache();
	mockRequestAuth = mockRequestAuthentication(requestUser);
	mockSettingLoader = mockSettingsLoader();

	container.rebind(RequestAuthentication).toConstantValue(instance(mockRequestAuth));
	container.rebind(Cache).toConstantValue(instance(mockCache));
	container.rebind(SettingLoader).toConstantValue(instance(mockSettingLoader));

	bApp = await new App().buildApp(getTestDatabaseOptions());
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the container
	container.restore();
});

test('Test the dashboard page loads', async () => {
	// Perform the request along .../
	const response = await request(bApp).get('/');

	// Check that we get a OK (200) response code
	expect(response.status).toBe(HttpResponseCode.OK);
});
