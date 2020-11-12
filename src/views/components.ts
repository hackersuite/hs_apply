import { Page } from './page';

export interface PageComponent {
	name: string;
	uri: string;
	checkAccessForUris?: () => string[];
	dataProvider?: (uris: string[]) => any;
}

const frontendBaseURI = 'hs:hs_apply:frontend';
export const navbar: PageComponent = {
	name: 'navbar',
	uri: `${frontendBaseURI}:NavbarComponent`,
	// TODO: Refactor to not hardcode all the URIs of frontend pages
	checkAccessForUris: () => [
		'hs:hs_apply:Dashboard:dashboard',
		'hs:hs_apply:Application:apply',
		'hs:hs_apply:Admin:overview',
		'hs:hs_apply:Admin:manage',
		'hs:hs_apply:Review:review'
	],
	dataProvider: (uris: string[]) => uris.map((uri: string) => uri.split(':').slice(2).join(':'))
};

export function getAuthorizedComponents(page: Page, uris: string[]|undefined): Map<string, any> {
	const authorizedComponents: any = {};
	let componentData;

	if (!uris || uris.length === 0) return authorizedComponents;

	for (const component of page.components) {
		if (uris.includes(component.uri)) {
			componentData = component.dataProvider ? component.dataProvider(uris) : null;
			authorizedComponents[component.name] = componentData;
		}
	}

	return authorizedComponents;
}
