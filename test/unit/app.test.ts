import { Express } from 'express';
import { App } from '../../src/app';
import { getConnection } from 'typeorm';
import { getTestDatabaseOptions, initEnv } from '../util/testUtils';

/**
 * Setup the env variables for the tests
 */
beforeAll(() => {
	initEnv();
});

/**
 * Building app with default settings
 */
test('App should build without errors', async done => {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	await new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
		expect(err).toBe(undefined);
		expect(builtApp.get('port')).toBe(process.env.PORT ?? 3000);
		expect(builtApp.get('env')).toBe(process.env.ENVIRONMENT ?? 'production');
		expect(getConnection('applications').isConnected).toBeTruthy();
		await getConnection('applications').close();
		done();
	}, getTestDatabaseOptions());
});

/**
 * Testing dev environment
 */
test('App should start in dev environment', async done => {
	process.env.ENVIRONMENT = 'dev';
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	await new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
		expect(builtApp.get('env')).toBe('dev');
		expect(err).toBe(undefined);
		expect(getConnection('applications').isConnected).toBeTruthy();
		await getConnection('applications').close();
		done();
	}, getTestDatabaseOptions());
});

/**
 * Testing production environment
 */
test('App should start in production environment', async done => {
	process.env.ENVIRONMENT = 'production';
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	await new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
		expect(builtApp.get('env')).toBe('production');
		expect(builtApp.get('trust proxy')).toBe(1);
		expect(err).toBe(undefined);
		expect(getConnection('applications').isConnected).toBeTruthy();
		await getConnection('applications').close();
		done();
	}, getTestDatabaseOptions());
});

/**
 * Testing error handling with incorrect settings
 */
test('App should throw error with invalid settings', async done => {
	process.env.DB_HOST = 'invalidhost';
	await new App().buildApp(
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (builtApp: Express, err: Error): Promise<void> => {
			expect(err).toBeTruthy();
			expect(getConnection('applications').isConnected).toBeFalsy();
			done();
			return Promise.resolve();
		}
	);
});
