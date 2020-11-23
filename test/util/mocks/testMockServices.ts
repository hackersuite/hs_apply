import { mock, when, anything } from 'ts-mockito';
import { CommonController } from '../../../src/controllers/commonController';
import { HttpResponseCode } from '../../../src/util/errorHandling';
import { SettingLoader, RequestAuthentication } from '../../../src/util';
import { AppConfig } from '../../../src/settings';
import { HackathonConfig } from '../../../src/models';
import { EmailService } from '../../../src/services';
import { User } from '@unicsmcr/hs_auth_client';
import { NextFunction, Request, Response } from 'express';
import { Cache } from '../../../src/util/cache';
import { DeepPartial } from 'typeorm';

export function setupCommonMocks() {
	mockFrontendRenderer();
	mockSettingsLoader();
	mockHackathonConfigCache();
}

export function mockFrontendRenderer(): jest.SpyInstance {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return jest.spyOn<any, any>(CommonController.prototype, 'renderPage').mockImplementationOnce((req, res, page, options) => {
		(res as Response).sendStatus(HttpResponseCode.OK);
		return Promise.resolve();
	});
}

export function mockSettingsLoader({ applicationsOpen = true } = {}): SettingLoader {
	const applicationsCloseTime = applicationsOpen
		? new Date(Date.now() + (10800 * 1000)).toString()
		: new Date().toString();
	const mockSettings: Partial<AppConfig> = {
		shortName: 'Hackathon',
		fullName: 'Hackathon',
		applicationsOpen: new Date().toString(),
		applicationsClose: applicationsCloseTime // 3 hours from now
	};

	const mockSettingLoader = mock(SettingLoader);
	when(mockSettingLoader.loadApplicationSettings(anything())).thenCall(app => {
		app.locals.settings = mockSettings;
	});

	return mockSettingLoader;
}

export function mockHackathonConfigCache(extendedConfig: DeepPartial<AppConfig> = {}): Cache {
	const mockCache = mock(Cache);
	const testConfig = {
		config: {
			email: { emailProvider: 'sendgrid' },
			review: {}
		}
	};
	if (Object.entries(extendedConfig).length > 0) {
		Object.assign(testConfig, { config: extendedConfig });
	}

	when(mockCache.getAll<HackathonConfig>(HackathonConfig.name)).thenCall(() => [testConfig]);

	return mockCache;
}

export function mockEmailService(): EmailService {
	const mockEmailService = mock(EmailService);
	when(mockEmailService.sendEmail(anything(), anything())).thenResolve();
	return mockEmailService;
}

export function mockRequestAuthentication(requestUser: User): RequestAuthentication {
	const mockRequestAuth = mock(RequestAuthentication);
	when(mockRequestAuth.passportSetup).thenReturn(() => null);
	when(mockRequestAuth.withAuthMiddleware(anything(), anything()))
		.thenCall((router, operationHandler) =>
			(req: Request, res: Response, next: NextFunction) => {
				req.user = requestUser;
				operationHandler(req, res, next);
			});
	return mockRequestAuth;
}
