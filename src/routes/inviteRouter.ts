import { Router } from 'express';
import { InviteController } from '../controllers';
import { RouterInterface, provideRouter } from './registerableRouter';
import { RequestAuthentication } from '../util/auth';

@provideRouter()
export class InviteRouter implements RouterInterface {
	private readonly _inviteController: InviteController;
	private readonly _requestAuth: RequestAuthentication;

	public constructor(
		inviteController: InviteController,
		requestAuth: RequestAuthentication
	) {
		this._inviteController = inviteController;
		this._requestAuth = requestAuth;
	}

	public getPathRoot = (): string => '/invite';

	public register = (): Router => {
		const router: Router = Router();

		router.post(
			'/batchSend',
			this._requestAuth.checkLoggedIn,
			this._requestAuth.checkIsOrganiser,
			this._inviteController.batchSend.bind(this._inviteController)
		);

		router.put(
			'/:id([a-f0-9-]+)/send',
			this._requestAuth.checkLoggedIn,
			this._requestAuth.checkIsOrganiser,
			this._inviteController.send.bind(this._inviteController)
		);

		router.get('/:id([a-f0-9-]+)/confirm',
			this._inviteController.confirm.bind(this._inviteController));

		return router;
	};
}
