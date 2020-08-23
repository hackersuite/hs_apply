import { Router, Request, Response, RequestHandler, NextFunction } from 'express';
import { ApplicationController } from '../controllers';
import { RouterInterface, provideRouter } from './registerableRouter';
import multer from 'multer';
import { HttpResponseCode } from '../util/errorHandling';
import { RequestAuthentication } from '../util/auth';

@provideRouter()
export class ApplicationRouter implements RouterInterface {
	private readonly _applicationController: ApplicationController;
	private readonly _requestAuth: RequestAuthentication;

	public constructor(
		applicationController: ApplicationController,
		requestAuth: RequestAuthentication
	) {
		this._applicationController = applicationController;
		this._requestAuth = requestAuth;
	}

	private readonly fileUploadHandler: RequestHandler = multer({
		storage: multer.memoryStorage(),
		limits: {
			fileSize: 5 * 1024 * 1024 // Max file size is 5MB
		},
		fileFilter: function(req, file, cb) {
			// Only allow .pdf, .doc and .docx
			if (
				file.mimetype !== 'application/pdf' &&
        file.mimetype !== 'application/msword' &&
        file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			) {
				return cb(new Error('Unsupported file format'), false);
			}
			cb(null, true);
		}
	}).any();

	private readonly fileCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
		this.fileUploadHandler(req, res, (err?: Error) => {
			if (err) {
				res.status(HttpResponseCode.BAD_REQUEST).send({
					error: true,
					message: err.message
				});
			} else {
				next();
			}
		});
	};

	private readonly getIfApplicationsStillOpen = (req: Request, res: Response): boolean => {
		const applicationsOpenTime: number = new Date(req.app.locals.settings.applicationsOpen).getTime();
		const applicationsCloseTime: number = new Date(req.app.locals.settings.applicationsClose).getTime();
		const currentTime: number = new Date().getTime();

		const applicationsOpen: boolean = currentTime >= applicationsOpenTime && currentTime <= applicationsCloseTime;
		res.locals.applicationsOpen = applicationsOpen;
		return applicationsOpen;
	};

	private readonly doNothingIfApplicationsClosed = (req: Request, res: Response, next: NextFunction): void => {
		this.getIfApplicationsStillOpen(req, res);
		next();
	};

	private readonly redirectIfApplicationsClosed = (req: Request, res: Response, next: NextFunction): void => {
		const applicationsOpen = this.getIfApplicationsStillOpen(req, res);
		if (applicationsOpen) {
			next();
		} else {
			return res.redirect('/');
		}
	};

	public getPathRoot = (): string => '/apply';

	public register = (): Router => {
		const router: Router = Router();

		// Protect all the following routes in the router
		// Ensure that at a minimum the user is logged in in order to access the apply page
		router.use(this._requestAuth.checkLoggedIn);

		router.get('/',
			this.redirectIfApplicationsClosed,
			this._applicationController.apply.bind(this._applicationController));

		router.post('/',
			this.redirectIfApplicationsClosed,
			this.fileCheckMiddleware,
			this._applicationController.submitApplication.bind(this._applicationController));

		router.post('/partial',
			this.fileCheckMiddleware,
			this._applicationController.updatePartialApplication.bind(this._applicationController));

		router.get('/cancel',
			this.doNothingIfApplicationsClosed,
			this._applicationController.cancel.bind(this._applicationController));

		router.put('/:id([a-f0-9-]+)/checkin',
			this._requestAuth.checkIsVolunteer,
			this._applicationController.checkin.bind(this._applicationController));

		return router;
	};
}
