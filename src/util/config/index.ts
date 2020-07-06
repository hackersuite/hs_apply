import { getEnv, intoNumber, intoBoolean } from './util';

export enum Environment {
	Dev = 'dev',
	Production = 'production'
}

interface EnvConfig {
	port: number;
	environment: Environment;
	useSSL: boolean;
	db: {
		type: string;
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
	sessionSecret: string;
	googleAnalyticsId: string;
	dropboxToken: string;
	sendgridToken: string;
}

export function load(source: Record<string, string | undefined> = process.env): EnvConfig {
	return {
		port: intoNumber(getEnv(source, 'PORT')),
		environment: getEnv(source, 'ENVIRONMENT') === 'dev' ? Environment.Dev : Environment.Production,
		useSSL: intoBoolean(getEnv(source, 'USE_SSL')),
		db: {
			type: getEnv(source, 'DB_TYPE'),
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
		sessionSecret: getEnv(source, 'SESSION_SECRET'),
		googleAnalyticsId: getEnv(source, 'GOOGLE_ANALYTICS_ID'),
		dropboxToken: getEnv(source, 'DROPBOX_API_TOKEN'),
		sendgridToken: getEnv(source, 'SENDGRID_API_KEY')
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

