import { injectable } from 'inversify';
import autoBind from 'auto-bind';

interface Page {
	components?: any;
}

@injectable()
export class PageProvider {
	private readonly pages: Map<string, Page>;
	public constructor() {
		autoBind(this);

		this.pages = this.buildPages();
	}

	public get(view: string): Page|undefined {
		return this.pages.get(view);
	}

	private buildPages(): Map<string, Page> {
		const pages = new Map<string, Page>();

		pages.set('pages/dashboard', { components: {}	});

		pages.set('pages/apply', { components: {}	});

		pages.set('pages/admin/adminManage', { components: {}	});
		pages.set('pages/manageApplication', { components: {}	});
		pages.set('pages/admin/adminOverview', { components: {}	});

		pages.set('pages/notify', { components: {}	});

		pages.set('pages/review/review', { components: {}	});

		return pages;
	}
}
