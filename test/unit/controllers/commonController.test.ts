import 'reflect-metadata';
import { mock, instance, resetCalls } from 'ts-mockito';
import { Request, Response } from 'express';
import { CommonController } from '../../../src/controllers/commonController';
import { dashboard, Page } from '../../../src/views/page';
import { Container } from 'inversify';
import { RequestAuthentication } from '../../../src/util';
import { mockHackathonConfigCache } from '../../util/mocks/testMockServices';
import { Cache } from '../../../src/util/cache';
import { PageComponent } from '../../../src/views/components';


const container = new Container();

let reqMock: Request;
let resMock: Response;
beforeAll(() => {
	reqMock = mock<Request>();
	resMock = mock<Response>();
});

afterEach(() => {
	resetCalls(reqMock);
	resetCalls(resMock);
});

class StubController extends CommonController {
	public async render(req, res, page, options) {
		await super.renderPage(req, res, page, options);
	}
}

const mockGetAuthResources = jest.fn().mockImplementation(() => Promise.resolve());
describe('renderPage tests', () => {
	const testCookie = 'test_cookie';
	let stubController: StubController;
	let requestAuth: RequestAuthentication;

	beforeAll(() => {
		// Test setup request cookies
		reqMock.cookies['Authorization'] = testCookie;
		resMock.render = jest.fn();

		const mockCache = mockHackathonConfigCache();
		container.bind(Cache).toConstantValue(instance(mockCache));

		// We need to mock a couple of functions that exist inside the AuthApi property
		// First, resolve the object that contains the cache that we bound above
		// Then change the underlying function for `getAuthorizedResources` to a mocked function
		// Rebind this updated object to `RequestAuthentication` which gets injected when StubController is created
		container.bind(RequestAuthentication).toSelf();
		requestAuth = container.get(RequestAuthentication);
		(requestAuth.authApi as any).getAuthorizedResources = mockGetAuthResources;
		requestAuth.getUserAuthToken = jest.fn().mockImplementation(() => testCookie);
		container.rebind(RequestAuthentication).toConstantValue(requestAuth);

		container.bind(StubController).toSelf();
		stubController = container.get(StubController);
	});

	test('Test renderPage renders page with no components', async () => {
		// Call the stub render function which calls the CommonController `renderPage`
		const testPage: Page = { path: 'pages/test', components: [] };
		await stubController.render(reqMock, resMock, testPage, {});

		expect(requestAuth.authApi.getAuthorizedResources).toBeCalledTimes(0);
		expect(requestAuth.getUserAuthToken).toBeCalledTimes(0);
		expect((resMock.render as jest.Mock)).toBeCalledWith(testPage.path, expect.anything());
	});

	test('Test renderPage renders page with components, no extra uri check ', async () => {
		// Call the stub render function which calls the CommonController `renderPage`
		const testComponent: PageComponent = {
			name: 'test_component',
			uri: `TestComponent`
		};
		const testPage: Page = { path: 'pages/test', components: [testComponent] };
		await stubController.render(reqMock, resMock, testPage, {});

		expect(requestAuth.authApi.getAuthorizedResources).toBeCalledWith(testCookie, [testComponent.uri]);
		expect(requestAuth.getUserAuthToken).toBeCalledTimes(1);
		expect((resMock.render as jest.Mock)).toBeCalledWith(testPage.path, expect.anything());
	});

	test('Test renderPage renders page with provided options', async () => {
		// Call the stub render function which calls the CommonController `renderPage`
		const testOptions = { testOption: 'test_option' };
		await stubController.render(reqMock, resMock, dashboard, testOptions);

		expect(requestAuth.authApi.getAuthorizedResources).toBeCalled();
		expect(requestAuth.getUserAuthToken).toBeCalled();
		expect((resMock.render as jest.Mock)).toBeCalledWith(dashboard.path, expect.objectContaining(testOptions));
	});

	test('Test renderPage renders error page when Auth API fails', async () => {
		mockGetAuthResources.mockImplementationOnce(() => Promise.reject());

		await stubController.render(reqMock, resMock, dashboard, {});

		expect(requestAuth.authApi.getAuthorizedResources).toBeCalled();
		expect(requestAuth.getUserAuthToken).toBeCalled();
		expect((resMock.render as jest.Mock)).toBeCalledWith('views/notify', expect.objectContaining({ message: expect.stringContaining('permission') }));
	});
});
