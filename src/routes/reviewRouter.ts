import { Router } from 'express';
import { ReviewController } from '../controllers';
import { RouterInterface, provideRouter } from './registerableRouter';
import { RequestAuthentication } from '../util/auth';

@provideRouter()
export class ReviewRouter implements RouterInterface {
	private readonly _reviewController: ReviewController;
	private readonly _requestAuth: RequestAuthentication;

	public constructor(
		reviewController: ReviewController,
		requestAuth: RequestAuthentication
	) {
		this._reviewController = reviewController;
		this._requestAuth = requestAuth;
	}

	public getPathRoot = (): string => '/review';

	public register = (): Router => {
		const router: Router = Router();

		router.get('/',
			this._requestAuth.withAuthMiddleware(this, this._reviewController.reviewPage));

		router.get('/next',
			this._requestAuth.withAuthMiddleware(this, this._reviewController.nextReview));

		router.post(
			'/submit',
			this._requestAuth.withAuthMiddleware(this, this._reviewController.submit)
		);

		return router;
	};
}
