import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { RequestAuthentication } from '../util';
import autoBind from 'auto-bind';
import { Page } from '../views/page';
import { getAuthorizedComponents } from '../views/components';

@injectable()
export abstract class CommonController {
	@inject(RequestAuthentication)
	private readonly _requestAuthentication!: RequestAuthentication;

	public constructor() {
		autoBind(this);
	}

	protected async renderPage(req: Request, res: Response, page: Page, options: any): Promise<void> {
		let authorizedURIs: string[];

		if (page.components.length !== 0) {
			const componentUris: string[] = [];
			for (const component of page.components) {
				const extraUris = component.checkAccessForUris ? component.checkAccessForUris() : [];
				componentUris.push(component.uri, ...extraUris);
			}

			try {
				authorizedURIs = await this._requestAuthentication.authApi.getAuthorizedResources(
					this._requestAuthentication.getUserAuthToken(req), componentUris
				);
			} catch (err) {
				this.handleUnauthorizedFrontend(res);
				return;
			}
		}

		const authorizedComponents = getAuthorizedComponents(page, authorizedURIs!);
		res.render(page.path, { components: authorizedComponents, ...options });
	}

	private handleUnauthorizedFrontend(res: Response): void {
		res.render('views/');
	}
}
