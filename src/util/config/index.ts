import { getEnv, intoNumber, intoBoolean } from './util';

export enum Environment {
	Dev = 'dev',
	Production = 'production'
}

export interface EnvConfig {
	port: number;
	environment: Environment;
	useSSL: boolean;
	db: {
		host: string;
		port: number;
		user: string;
		password: string;
		database: string;
	};
	hs: {
		applicationUrl: string;
		authUrl: string;
	};
	googleAnalyticsId: string;
	dropboxToken: string;
	sendgridToken: string;
}

export function load(source: Record<string, string | undefined> = process.env): EnvConfig {
	const environment = getEnv(source, 'ENVIRONMENT');
	if (![Environment.Dev, Environment.Production].includes(environment as Environment)) {
		throw new Error(`Invalid ENVIRONMENT variable, must be 'dev' or 'production'`);
	}

	return {
		port: intoNumber(getEnv(source, 'PORT')),
		environment: environment === 'dev' ? Environment.Dev : Environment.Production,
		useSSL: intoBoolean(getEnv(source, 'USE_SSL')),
		db: {
			host: getEnv(source, 'DB_HOST'),
			port: intoNumber(getEnv(source, 'DB_PORT')),
			user: getEnv(source, 'DB_USER'),
			password: getEnv(source, 'DB_PASSWORD'),
			database: getEnv(source, 'DB_DATABASE')
		},
		hs: {
			applicationUrl: getEnv(source, 'APPLICATION_URL'),
			authUrl: getEnv(source, 'AUTH_URL')
		},
		googleAnalyticsId: getEnv(source, 'GOOGLE_ANALYTICS_ID'),
		dropboxToken: getEnv(source, 'DROPBOX_API_TOKEN'),
		sendgridToken: getEnv(source, 'SENDGRID_API_TOKEN')
	};
}

let globalConfig: EnvConfig|undefined;

export function getConfig(source?: Record<string, string | undefined>, refresh = false): EnvConfig {
	if (globalConfig && refresh) {
		globalConfig = Object.assign(globalConfig, load(source));
	} else if (!globalConfig) {
		globalConfig = load(source);
	}
	return globalConfig;
}

