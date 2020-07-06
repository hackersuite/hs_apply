import { getTestDatabaseOptions, initEnv, updateEnv } from '../util/testUtils';
initEnv();

import { getConnection } from 'typeorm';
import { App } from '../../src/app';

/**
 * Setup the env variables for the tests
 */
beforeAll(() => {
	initEnv();
});

/**
 * Building app with default settings
 */
test('App should build without errors', async () => {
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('port')).toBe(Number(process.env.PORT ?? 3000));
	expect(builtApp.get('env')).toBe(process.env.ENVIRONMENT ?? 'production');
	expect(getConnection('applications').isConnected).toBeTruthy();
	await getConnection('applications').close();
});

/**
 * Testing dev environment
 */
test('App should start in dev environment', async () => {
	updateEnv({
		ENVIRONMENT: 'dev'
	});
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('env')).toBe('dev');
	expect(getConnection('applications').isConnected).toBeTruthy();
	await getConnection('applications').close();
});

/**
 * Testing production environment
 */
test('App should start in production environment', async () => {
	updateEnv({
		ENVIRONMENT: 'production'
	});
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('env')).toBe('production');
	expect(builtApp.get('trust proxy')).toBe(1);
	expect(getConnection('applications').isConnected).toBeTruthy();
	await getConnection('applications').close();
});

/**
 * Testing error handling with incorrect settings
 */
test('App should throw error with invalid settings', async () => {
	process.env.DB_HOST = 'invalidhost';
	await expect(new App().buildApp()).rejects.toThrow();
	expect(getConnection('applications').isConnected).toBeFalsy();
});
