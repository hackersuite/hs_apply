import { Router } from 'express';
import { DashboardController } from '../controllers';
import { RouterInterface, provideRouter } from './registerableRouter';
import { RequestAuthentication } from '../util/auth';

@provideRouter()
export class DashboardRouter implements RouterInterface {
	private readonly _dashboardController: DashboardController;
	private readonly _requestAuth: RequestAuthentication;

	public constructor(
		dashboardController: DashboardController,
		requestAuth: RequestAuthentication
	) {
		this._dashboardController = dashboardController;
		this._requestAuth = requestAuth;
	}

	public getPathRoot = (): string => '/';

	public register = (): Router => {
		const router: Router = Router();

		router.use(this._requestAuth.checkLoggedIn);

		router.get('/', this._dashboardController.dashboard);

		return router;
	};
}
