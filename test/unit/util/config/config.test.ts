/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { load, EnvConfig, Environment, getConfig } from '../../../../src/util/config';

// Valid fixture
const fixture1: [Record<string, string>, EnvConfig] = [
	{
		PORT: '8000',
		ENVIRONMENT: 'dev',
		USE_SSL: 'true',
		DB_HOST: 'localhost',
		DB_PORT: '3306',
		DB_USER: 'root',
		DB_PASSWORD: 'password',
		DB_DATABASE: 'applications',
		APPLICATION_URL: 'http://localhost:8080',
		AUTH_URL: 'http://localhost:8001',
		GOOGLE_ANALYTICS_ID: 'analyticsId',
		DROPBOX_API_TOKEN: '',
		SENDGRID_API_TOKEN: 'token'
	},
	{
		port: 8000,
		environment: Environment.Dev,
		useSSL: true,
		db: {
			host: 'localhost',
			user: 'root',
			port: 3306,
			password: 'password',
			database: 'applications'
		},
		hs: {
			applicationUrl: 'http://localhost:8080',
			authUrl: 'http://localhost:8001'
		},
		googleAnalyticsId: 'analyticsId',
		dropboxToken: '',
		sendgridToken: 'token'
	}
];

// Valid fixture
const fixture2: [Record<string, string>, EnvConfig] = [
	{
		PORT: '8000',
		ENVIRONMENT: 'production',
		USE_SSL: 'true',
		DB_HOST: 'localhost',
		DB_PORT: '3306',
		DB_USER: 'root',
		DB_PASSWORD: 'password',
		DB_DATABASE: 'applications',
		APPLICATION_URL: 'http://localhost:8080',
		AUTH_URL: 'http://localhost:8001',
		GOOGLE_ANALYTICS_ID: '',
		DROPBOX_API_TOKEN: '',
		SENDGRID_API_TOKEN: ''
	},
	{
		port: 8000,
		environment: Environment.Production,
		useSSL: true,
		db: {
			host: 'localhost',
			user: 'root',
			port: 3306,
			password: 'password',
			database: 'applications'
		},
		hs: {
			applicationUrl: 'http://localhost:8080',
			authUrl: 'http://localhost:8001'
		},
		googleAnalyticsId: '',
		dropboxToken: '',
		sendgridToken: ''
	}
];

describe('load config', () => {
	test('Valid env fixtures load correctly', () => {
		// Test it works when passing in the variables as a param
		expect(load(fixture1[0])).toEqual(fixture1[1]);
		// Test it works with environment variables
		Object.assign(process.env, fixture2[0]);
		expect(load()).toEqual(fixture2[1]);
	});

	test('Throws for missing values', () => {
		for (const envKey of Object.keys(fixture1[0])) {
			const fixture = { ...fixture1[0] };
			delete fixture[envKey];
			expect(() => load(fixture)).toThrow();
		}

		for (const envKey of Object.keys(fixture2[0])) {
			const fixture = { ...fixture2[0] };
			fixture[envKey] = undefined;
			expect(() => load(fixture)).toThrow();
		}
	});

	test('Environment types', () => {
		expect(load(fixture1[0]).environment).toStrictEqual(Environment.Dev);
		expect(load(fixture2[0]).environment).toStrictEqual(Environment.Production);
		expect(() => load({ ...fixture1[0], ENVIRONMENT: 'invalid' })).toThrow();
		expect(() => load({ ...fixture1[0], ENVIRONMENT: 'prod' })).toThrow();
		expect(() => load({ ...fixture1[0], ENVIRONMENT: 'development' })).toThrow();
	});
});


describe('getConfig', () => {
	test('Caching', () => {
		let config = getConfig(fixture1[0]);
		expect(config).toEqual(fixture1[1]);
		expect(getConfig({ ...fixture1[0], PORT: '25565' })).toStrictEqual(config);
		expect(getConfig({ ...fixture1[0], ENVIRONMENT: 'invalid' })).toStrictEqual(config);
		const oldConfig = { ...config };
		config = getConfig({ ...fixture1[0], PORT: '25565', ENVIRONMENT: 'production' }, true);
		expect(config).not.toEqual(oldConfig);
		expect(getConfig({ ...fixture1[0], PORT: '25565' })).toStrictEqual(config);
		expect(getConfig({ ...fixture1[0], ENVIRONMENT: 'invalid' })).toStrictEqual(config);
	});
});
