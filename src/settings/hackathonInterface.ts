export interface HackathonSettingsInterface {
	shortName: string;
	fullName: string;
	rootDomain: string;
	hackathonURL: string;
	applicationsOpen: string;
	applicationsClose: string;
	mainEmail: string;
	contactEmail: string;
	facebookLink: string;
	instagramLink: string;
	twitterLink: string;
	config: ApplicationConfig;
}

export interface ApplicationConfig {
	minimumReviews: number;
}
