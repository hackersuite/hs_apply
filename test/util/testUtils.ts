/* eslint-disable @typescript-eslint/ban-types */
import { Request, Response, NextFunction } from 'express';
import { Connection, createConnections, getConnection, ConnectionOptions } from 'typeorm';
import { getConfig, Environment } from '../../src/util/config';
import { mock, when, anything } from 'ts-mockito';
import { RequestAuthentication, SettingLoader } from '../../src/util';
import { User } from '@unicsmcr/hs_auth_client';

export function getTestDatabaseOptions(entities?: (string | Function)[], name?: string): ConnectionOptions[] {
	return [
		{
			name: name ?? 'default',
			type: 'mysql',
			database: 'hs_applications',
			host: 'localhost',
			port: 3306,
			username: 'root',
			synchronize: true,
			logging: false,
			entities: entities ?? [`${__dirname}/../../src/models/db/*{.js,.ts}`]
		}
	];
}

export async function createTestDatabaseConnection(entities?: (string | Function)[]): Promise<Connection> {
	const testConnection: Connection[] = await createConnections(getTestDatabaseOptions(entities));

	if (testConnection[0].isConnected) return testConnection[0];
	throw new Error('Failed to create the testing database!');
}

export async function closeTestDatabaseConnection(name?: string): Promise<void> {
	await getConnection(name).dropDatabase();
	await getConnection(name).close();
}

export async function reloadTestDatabaseConnection(name?: string): Promise<void> {
	await getConnection(name).synchronize(true);
}

export function updateEnv(props: Record<string, string>) {
	Object.assign(process.env, props);
	getConfig(process.env, true);
}

export function initEnv(): void {
	process.env.PORT = '3000';
	process.env.ENVIRONMENT = Environment.Dev;
	process.env.USE_SSL = 'false';

	process.env.DB_HOST = '';
	process.env.DB_PORT = '3000';
	process.env.DB_USER = '';
	process.env.DB_PASSWORD = '';
	process.env.DB_DATABASE = '';

	process.env.AUTH_URL = 'localhost:auth';
	process.env.APPLICATION_URL = 'localhost:applications';
	process.env.HS_AUTH_SERVICE_TOKEN = '';

	process.env.GOOGLE_ANALYTICS_ID = '';
	process.env.DROPBOX_API_TOKEN = 'api_key';
	process.env.SENDGRID_API_TOKEN = '';
	getConfig(process.env, true);
}

export function setupTestingEnvironment(): void {
	initEnv();
	mockTransactions();
}

export function mockTransactions(): void {
	jest.mock('typeorm-transactional-cls-hooked', () => ({
		Transactional: () => () => ({}),
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		BaseRepository: class { }
	}));
}

export function unmockTransactions(): void {
	jest.unmock('typeorm-transactional-cls-hooked');
}

export function mockSettingsLoader() {
	const mockSettingLoader = mock(SettingLoader);
	when(mockSettingLoader.loadApplicationSettings(anything())).thenCall(app => {
		app.locals.settings = {
			shortName: 'Hackathon',
			fullName: 'Hackathon',
			applicationsOpen: new Date().toString(),
			applicationsClose: new Date(Date.now() + (10800 * 1000)).toString() // 3 hours from now
		};
	});
	return mockSettingLoader;
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
