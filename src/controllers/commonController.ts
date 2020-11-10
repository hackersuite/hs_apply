import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { RequestAuthentication } from '../util';
import autoBind from 'auto-bind';

@injectable()
export abstract class CommonController {
	@inject(RequestAuthentication)
	private readonly _requestAuthentication!: RequestAuthentication;

	public constructor() {
		autoBind(this);
	}

	protected async renderPage(req: Request, res: Response, page: any, options: any): Promise<void> {
		let authorizedURIs;
		try {
			authorizedURIs = await this._requestAuthentication.authApi.getAuthorizedResources(
				this._requestAuthentication.getUserAuthToken(req), page.componentURIs
			);
		} catch (err) {
			this.handleUnauthorizedFrontend(res);
			return;
		}

		const authorizedComponents = page.getAuthorizedComponents(authorizedURIs);

		res.render(page.name, options, authorizedComponents);
	}

	private handleUnauthorizedFrontend(res: Response): void {
		res.render('views/');
	}
}
