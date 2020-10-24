import { mock } from 'ts-mockito';
import { Express, NextFunction, Request, Response } from 'express';
import { setupTestingEnvironment } from '../../../util';
import { RequestAuthentication } from '../../../../src/util';
import { User } from '@unicsmcr/hs_auth_client';
import { RouterInterface } from '../../../../src/routes';

// Ensure the last import is the inversify container as we need all everything bound
// before we create the container
import container from '../../../../src/inversify.config';

let requestAuth: RequestAuthentication;

const requestUser: User = {
	name: 'Test',
	email: 'test@test.com',
	id: '010101'
};

beforeAll(() => {
	setupTestingEnvironment();
});

let reqMock: Request;
let resMock: Response;
let nextFunctionMock: jest.Mock<NextFunction>;
beforeEach(() => {
	reqMock = mock<Request>();
	resMock = mock<Response>();
	nextFunctionMock = jest.fn();
});

describe('WithAuthMiddleware tests', () => {
	beforeEach(() => {
		requestAuth = container.get(RequestAuthentication);
	});
	afterEach(() => {
		mockOpHandler.mockReset();
	});

	const mockRouter: RouterInterface = {
		getPathRoot: jest.fn(() => '/test'),
		register: undefined
	};
	const mockOpHandler = jest.fn(async () => Promise.resolve());

	test('User authenticated with valid permissions', async () => {
		// Mock the hs_auth API calls
		requestAuth.authApi.getCurrentUser = jest.fn(() => Promise.resolve(requestUser));
		requestAuth.authApi.getAuthorizedResources = jest.fn(() => Promise.resolve(['hs:hs_test']));

		// Test setup cookies and mock passport
		reqMock.cookies['Authorization'] = 'test_cookie';
		requestAuth.passportSetup(mock<Express>());

		await requestAuth.withAuthMiddleware(mockRouter, mockOpHandler)(reqMock, resMock, nextFunctionMock);

		expect(reqMock.user).toBe(requestUser);
		expect(mockOpHandler).toHaveBeenCalledTimes(1);
		expect(requestAuth.authApi.getCurrentUser as jest.Mock).toHaveBeenCalledTimes(1);
		expect(requestAuth.authApi.getAuthorizedResources as jest.Mock).toHaveBeenCalledTimes(1);
	});

	test('User redirected when user is not authenticated', async () => {
		// Mock the hs_auth API calls
		requestAuth.authApi.getCurrentUser = jest.fn(() => Promise.resolve(requestUser));
		requestAuth.authApi.getAuthorizedResources = jest.fn(() => Promise.resolve([]));

		// Test setup for creating a mock of the redirect function we can spy on
		resMock.redirect = jest.fn();
		requestAuth.passportSetup(mock<Express>());

		// Perform the test
		await requestAuth.withAuthMiddleware(mockRouter, mockOpHandler)(reqMock, resMock, nextFunctionMock);

		// Verify that the auth request failed and we are redirected to login
		expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
	});

	test('User redirected when user auth API call fails with error', async () => {
		// Mock the hs_auth API calls
		requestAuth.authApi.getCurrentUser = jest.fn(() => Promise.reject());
		requestAuth.authApi.getAuthorizedResources = jest.fn(() => Promise.resolve(['hs:hs_test']));

		// Test setup for creating a mock of the redirect function we can spy on
		resMock.redirect = jest.fn();
		requestAuth.passportSetup(mock<Express>());

		// Perform the test
		await requestAuth.withAuthMiddleware(mockRouter, mockOpHandler)(reqMock, resMock, nextFunctionMock);

		// Verify that the auth request failed and we are redirected to login
		expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
	});
});
