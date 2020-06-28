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
test('App should build without errors', async () => {
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('port')).toBe(process.env.PORT ?? 3000);
	expect(builtApp.get('env')).toBe(process.env.ENVIRONMENT ?? 'production');
	expect(getConnection('applications').isConnected).toBeTruthy();
	await getConnection('applications').close();
});

/**
 * Testing dev environment
 */
test('App should start in dev environment', async () => {
	process.env.ENVIRONMENT = 'dev';
	const builtApp = await new App().buildApp(getTestDatabaseOptions());
	expect(builtApp.get('env')).toBe('dev');
	expect(getConnection('applications').isConnected).toBeTruthy();
	await getConnection('applications').close();
});

/**
 * Testing production environment
 */
test('App should start in production environment', async () => {
	process.env.ENVIRONMENT = 'production';
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
