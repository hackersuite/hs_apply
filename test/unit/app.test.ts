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
test('App should build without errors', done => {
	new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
		expect(err).toBe(undefined);
		expect(builtApp.get('port')).toBe(process.env.PORT || 3000);
		expect(builtApp.get('env')).toBe(process.env.ENVIRONMENT || 'production');
		expect(getConnection('applications').isConnected).toBeTruthy();
		await getConnection('applications').close();
		done();
	}, getTestDatabaseOptions());
});

/**
 * Testing dev environment
 */
test('App should start in dev environment', done => {
	process.env.ENVIRONMENT = 'dev';
	new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
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
test('App should start in production environment', done => {
	process.env.ENVIRONMENT = 'production';
	new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
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
test('App should throw error with invalid settings', done => {
	process.env.DB_HOST = 'invalidhost';
	new App().buildApp(
		async (builtApp: Express, err: Error): Promise<void> => {
			expect(err).toBeTruthy();
			expect(getConnection('applications').isConnected).toBeFalsy();
			done();
		}
	);
});
