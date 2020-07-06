import { getEnv, intoNumber } from './util';

enum Environment {
	Dev,
	Production
}

interface EnvConfig {
	port: number;
	environment: Environment;
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

export function load(source: Record<string, string | undefined>): EnvConfig {
	return {
		port: intoNumber(getEnv(source, 'PORT')),
		environment: getEnv(source, 'ENVIRONMENT') === 'dev' ? Environment.Dev : Environment.Production,
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

export function loadGlobal(source: Record<string, string | undefined>): EnvConfig {
	globalConfig = load(source);
	return globalConfig;
}

let globalConfig = load(process.env);
export default globalConfig;
