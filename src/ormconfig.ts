import { ConnectionOptions } from 'typeorm';
import { getConfig, Environment } from './util/config';

const config: ConnectionOptions = {
	type: 'mysql',
	host: getConfig().db.host,
	port: getConfig().db.port,
	username: getConfig().db.user,
	password: getConfig().db.password,
	database: getConfig().db.database,
	entities: [`${__dirname}/models/db/**/*{.js,.ts}`],
	extra: {
		charset: 'utf8mb4_unicode_ci'
	},
	migrations: ['src/migration/*.ts'],
	cli: {
		migrationsDir: 'src/migrations'
	},
	synchronize: getConfig().environment === Environment.Dev // Note: Unsafe in production, use migrations instead
};

export = config;
