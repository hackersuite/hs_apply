import { getTestDatabaseOptions, initEnv, updateEnv } from '../util/testUtils';
initEnv();

import { getConnection } from 'typeorm';
import { App } from '../../src/app';
import { Environment } from '../../src/util/config';

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
	expect(getConnection().isConnected).toBeTruthy();
	await getConnection().close();
});

/**
 * Testing dev environment
 */
test('App should start in dev environment', async () => {
	updateEnv({
		ENVIRONMENT: Environment.Dev
	});
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('env')).toBe(Environment.Dev);
	expect(getConnection().isConnected).toBeTruthy();
	await getConnection().close();
});

/**
 * Testing production environment
 */
test('App should start in production environment', async () => {
	updateEnv({
		ENVIRONMENT: Environment.Production
	});
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('env')).toBe(Environment.Production);
	expect(builtApp.get('trust proxy')).toBe(1);
	expect(getConnection().isConnected).toBeTruthy();
	await getConnection().close();
});

/**
 * Testing error handling with incorrect settings
 */
test('App should throw error with invalid settings', async () => {
	process.env.DB_HOST = 'invalidhost';
	await expect(new App().buildApp()).rejects.toThrow();
	expect(getConnection().isConnected).toBeFalsy();
});
