import { Request, Response } from 'express';
import { ApiError } from './apiError';
import { HttpResponseCode } from './httpResponseCode';
import { logger } from '../logger';
import { getConfig, Environment } from '../../util/config';

// const toEmails: string[] = ["admin@unicsmcr.com"];

/**
 * Handles errors thrown by requests
 */
export const errorHandler = (err: ApiError | Error, req: Request, res: Response): void => {
	if (err instanceof Error) {
		if (getConfig().environment === Environment.Production) {
			// Send notification to admins when an uncaught error occurs
			//   sendEmail("noreply@unicsmcr.com",
			//   toEmails,
			//     "Uncaught Error: " + err.name,
			//     err.message + err.stack
			//   );
		}

		logger.error(`${err.message}\n${err.stack ?? ''}`);
		res.status(HttpResponseCode.INTERNAL_ERROR).send('An error occured.');
	} else {
		res.status(err.statusCode).send(err);
	}
};

/**
 * Handles 404 errors
 */
export const error404Handler = (req: Request, res: Response): void => {
	const apiError: ApiError = new ApiError(HttpResponseCode.NOT_FOUND);
	res.status(HttpResponseCode.NOT_FOUND).render('pages/404', { components: {}, error: apiError });
};
