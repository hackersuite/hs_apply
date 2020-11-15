import { EmailProvider } from '../services/mail/emailService';

export interface AppConfig {
	shortName: string;
	fullName: string;
	rootDomain: string;
	hackathonURL: string;
	applicationsOpen: string;
	applicationsClose: string;
	review: {
		minimumReviews: number;
	};
	email: {
		emailProvider: EmailProvider;
		mainEmail: string;
		contactEmail: string;
	};
	social: {
		facebookHandle: string;
		instagramHandle: string;
		twitterHandle: string;
	};
}
