import { PageComponent, navbar } from './components';

export interface Page {
	path: string;
	components: PageComponent[];
}

export const dashboard: Page = { path: 'pages/dashboard', components: [navbar]	};

export const apply: Page = { path: 'pages/apply', components: [navbar]	};

export const adminManage: Page = { path: 'pages/admin/adminManage', components: [navbar]	};
export const adminOverview: Page = { path: 'pages/admin/adminOverview', components: [navbar]	};
export const manageApplication: Page = { path: 'pages/manageApplication', components: [navbar]	};

export const notify: Page = { path: 'pages/notify', components: [navbar]	};

export const review: Page = { path: 'pages/review/review', components: [navbar]	};
