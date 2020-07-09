import 'reflect-metadata';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Environment, getConfig } from './util/config';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express, { Express, Request, Response, NextFunction } from 'express';
import { ConnectionOptions, createConnections } from 'typeorm';
import { RouterInterface } from './routes';
import { TYPES } from './types';
import container from './inversify.config';
import { error404Handler, errorHandler } from './util/errorHandling';
import { RequestAuthentication } from './util/auth';
import { SettingLoader } from './util/fs/loader';
import { reqLogger, logger } from './util';

export class App {
	public async buildApp(
		connectionOptions?: ConnectionOptions[]
	): Promise<Express> {
		const app: Express = this.expressSetup();

		// Set up express middleware for request routing
		this.middlewareSetup(app);

		if (app.get('env') === Environment.Dev) {
			this.devMiddlewareSetup(app);
		}

		// Load the hackathon application settings from disk
		const settingLoader: SettingLoader = container.get(TYPES.SettingLoader);
		try {
			await settingLoader.loadApplicationSettings(app);
		} catch (err) {
			logger.error(err);
		}

		// Connecting to database
		const databaseConnectionSettings: ConnectionOptions[] = connectionOptions ?? this.createDatabaseSettings();

		const connections = await createConnections(databaseConnectionSettings);
		connections.forEach(element => {
			logger.info(`Connection to database (${element.name}) established.`);
		});

		// Set up passport for authentication
		// Also add the logout route
		const requestAuth: RequestAuthentication = container.get(TYPES.RequestAuthentication);
		requestAuth.passportSetup(app);

		// Routes set up for express, resolving dependencies
		// This is performed after successful DB connection since some routers use TypeORM repositories in their DI
		const routers: RouterInterface[] = container.getAll(TYPES.Router);
		routers.forEach(router => {
			app.use(router.getPathRoot(), router.register());
		});

		// Setting up error handlers
		app.use(error404Handler);
		app.use(errorHandler);
		return app;
	}

	/**
   * Creates an Express app
   */
	private readonly expressSetup = (): Express => {
		// Create Express server
		const app = express();

		// view engine setup
		app.set('views', path.join(__dirname, 'views'));
		app.set('view engine', 'ejs');

		// Express configuration
		app.set('port', getConfig().port);
		app.set('env', getConfig().environment);
		if (getConfig().environment === Environment.Production) {
			app.set('trust proxy', 1);
		}

		return app;
	};

	/**
   * Sets up middleware used by the app
   * @param app The app to set up the middleware for
   */
	private readonly middlewareSetup = (app: Express): void => {
		app.use((req, res, next) => {
			if (req.get('X-Forwarded-Proto') !== 'https' && getConfig().useSSL) {
				res.redirect(`https://${req.headers.host ?? ''}${req.url}`);
			} else {
				return next();
			}
		});

		app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));
		app.use(cookieParser());

		// Sets and removes some standard HTTP headers that prevent some common attacks
		app.use(helmet());
	};

	/**
   * Sets up middleware used on development environments
   * @param app The app to set up the middleware for
   */
	private readonly devMiddlewareSetup = (app: Express): void => {
		// Request logging
		app.use(reqLogger);

		// Disable browser caching
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
			res.header('Expires', '-1');
			res.header('Pragma', 'no-cache');
			next();
		});
	};

	private readonly createDatabaseSettings = (): ConnectionOptions[] => [
		{
			name: 'applications',
			type: 'mysql',
			host: getConfig().db.host,
			port: getConfig().db.port,
			username: getConfig().db.user,
			password: getConfig().db.password,
			database: getConfig().db.database,
			entities: [`${__dirname}/models/db/*{.js,.ts}`],
			synchronize: true // Note: Unsafe in productionn, use migrations instead
		}
	];
}
