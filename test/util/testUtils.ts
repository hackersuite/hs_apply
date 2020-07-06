/* eslint-disable @typescript-eslint/ban-types */
import { Connection, createConnections, getConnection, ConnectionOptions } from 'typeorm';
import { getConfig } from '../../src/util/config';

export function getTestDatabaseOptions(entities?: (string | Function)[], name?: string): ConnectionOptions[] {
	return [
		{
			name: name ?? 'applications',
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
	process.env.ENVIRONMENT = 'dev';
	process.env.USE_SSL = 'false';

	process.env.DB_TYPE = 'mysql';
	process.env.DB_HOST = '';
	process.env.DB_PORT = '3000';
	process.env.DB_USER = '';
	process.env.DB_PASSWORD = '';
	process.env.DB_DATABASE = '';

	process.env.AUTH_URL = 'localhost:auth';
	process.env.APPLICATION_URL = 'localhost:applications';

	process.env.SESSION_SECRET = 'cat';
	process.env.GOOGLE_ANALYTICS_ID = '';
	process.env.DROPBOX_API_TOKEN = 'api_key';
	process.env.SENDGRID_API_KEY = '';
	getConfig(process.env, true);
}
